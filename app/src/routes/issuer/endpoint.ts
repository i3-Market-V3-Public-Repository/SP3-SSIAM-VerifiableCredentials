import { RequestHandler, Router as AppRouter /*, urlencoded*/ } from 'express'

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
  //const body = urlencoded({ extended: false })

  // Wait controller initialization
  await controller.initialize()

  // Handle view
  appRouter.use((req, res, next) => {
    const orig = res.render
    // MVC render engine with layouts
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
  appRouter.get('/subscribe', setNoCache, nextIfError(controller.subscribeIssuer))
  appRouter.get('/unsubscribe', setNoCache, nextIfError(controller.unsubscribeIssuer))
  appRouter.get('/verify', setNoCache, nextIfError(controller.verifyTrustedIssuer))
  
  // Handle errors
  // appRouter.use(controller.onError)

  return { appRouter }
}
export default endpoint