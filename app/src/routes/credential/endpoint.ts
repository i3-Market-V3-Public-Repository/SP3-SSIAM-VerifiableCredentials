import { RequestHandler, Router as AppRouter, urlencoded } from 'express'

import { WebSocketRouter } from '../../ws'
import { EndpointLoader } from '../../endpoint'
import InteractionController from './controller'

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

const endpoint: EndpointLoader = async (app, wss) => {
  const appRouter = AppRouter()
  const basicRouter = AppRouter()
  const wsRouter = WebSocketRouter()  
  const controller = new InteractionController(wss)  

  // Wait controller initialization
  await controller.initialize()

  // Handle view
  appRouter.use((req, res, next) => {
    const orig = res.render
    // you'll probably want to use a full blown render engine capable of layouts
    res.render = (view, locals) => {
      app.render(view, locals, (err, html) => {
        if (err) throw err
        orig.call(res, '_layout_authenticate', {
          ...locals,
          body: html
        })
      })
    }
    next()
  })
  

  // Setup app routes
  appRouter.post('/issue/:did', setNoCache, body, nextIfError(controller.addCredentialByDid)) // se authenticato
  basicRouter.post('/revoke', setNoCache, body, nextIfError(controller.revokeCredentialByJWT))
  basicRouter.post('/verify', setNoCache, body, nextIfError(controller.verifyCredentialByJWT))

  // Setup ws routes
  wsRouter.connect('/did/:uid/socket', controller.socketConnect)
  wsRouter.message('/did/:uid/socket', controller.socketMessage)
  wsRouter.close('/did/:uid/socket', controller.socketClose)
  
  
  //appRouter.get('/credential/verify/:claim', setNoCache, nextIfError(controller.verifyCredentialByClaim))
  //appRouter.get('/credential/verify/callback', setNoCache, nextIfError(controller.verifyCredentialCallback))
  
  // Handle errors
  // appRouter.use(controller.onError)

  return { appRouter, wsRouter, basicRouter }
}
export default endpoint