import { RequestHandler, Router as AppRouter } from 'express'

import { WebSocketRouter } from '../../ws'
import { EndpointLoader } from '../../endpoint'
import InteractionController from './controller'
import config from '../../config'

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

const endpoint: EndpointLoader = async (app, wss) => {
  const appRouter = AppRouter()
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
  appRouter.get(config.getContextPath + '/:credentialType/:did', setNoCache, nextIfError(controller.addCredentialByDid)) // se authenticato
  
  // Setup ws routes
  wsRouter.connect(config.getContextPath + '/did/:uid/socket', controller.socketConnect)
  wsRouter.message(config.getContextPath + '/did/:uid/socket', controller.socketMessage)
  wsRouter.close(config.getContextPath + '/did/:uid/socket', controller.socketClose)
  
  //appRouter.post('/credential/revoke', setNoCache, body, nextIfError(controller.revokeCredentialByJWT))
  //appRouter.get('/credential/verify/:claim', setNoCache, nextIfError(controller.verifyCredentialByClaim))
  //appRouter.get('/credential/verify/callback', setNoCache, nextIfError(controller.verifyCredentialCallback))
  
  // Handle errors
  // appRouter.use(controller.onError)

  return { appRouter, wsRouter }
}
export default endpoint