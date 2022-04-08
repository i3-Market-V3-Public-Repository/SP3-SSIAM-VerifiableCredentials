import { RequestHandler, Router as AppRouter, urlencoded } from 'express'

import { EndpointLoader } from '@i3-market/endpoint'
import PresentationController from './controller'

function nextIfError (handler: RequestHandler): RequestHandler {
  return async (req, res, next) => {
    await (handler(req, res, next) as any).catch(next)
  }
}

const setNoCache: RequestHandler = (req, res, next) => {
  res.set('Pragma', 'no-cache')
  res.set('Cache-Control', 'no-cache, no-store')
  next()
}

const body = urlencoded({ extended: false })

const endpoint: EndpointLoader = async (app) => {
  const appRouter = AppRouter()
  const basicRouter = AppRouter()  
  const controller = new PresentationController()  

  // Wait controller initialization
  await controller.initialize()

  // Handle view
  appRouter.use((req, res, next) => {
    const orig = res.render
    // you'll probably want to use a full blown render engine capable of layouts
    res.render = (view, locals) => {
      app.render(view, locals, (err, html) => {
        if (err) throw err
        orig.call(res, '_layout', {
          ...locals,
          body: html
        })
      })
    }
    next()
  })
  

  // Veramo routes
  appRouter.post('/verify', setNoCache, body, nextIfError(controller.verifyPresentation)) 


  return { appRouter, basicRouter }
}
export default endpoint