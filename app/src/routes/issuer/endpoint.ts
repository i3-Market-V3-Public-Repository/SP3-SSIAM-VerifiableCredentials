import { RequestHandler, Router as AppRouter, urlencoded } from 'express'

import { EndpointLoader } from '../../endpoint'
import IssuerController from './controller'

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

const endpoint: EndpointLoader = async (app) => {
  const appRouter = AppRouter()
  const controller = new IssuerController()
  const body = urlencoded({ extended: false })

  // Wait controller initialization
  // await controller.initialize()

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
  


  // Setup app routes
  appRouter.post('/subscribe', setNoCache, body, nextIfError(controller.subscribeIssuer))
  appRouter.post('/unsubscribe', setNoCache, body, nextIfError(controller.unsubscribeIssuer))
  
  
  
  // Handle errors
  // appRouter.use(controller.onError)

  return { appRouter }
}
export default endpoint