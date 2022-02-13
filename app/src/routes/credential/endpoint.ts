import { RequestHandler, Router as AppRouter, urlencoded } from 'express'

import { EndpointLoader } from '../../endpoint'
import CredentialController from './controller'

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
  const controller = new CredentialController()  

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

  // Veramo routes
  appRouter.get('/', setNoCache, nextIfError(controller.getCredentialList)) 
  appRouter.get('/issue/:credential/callbackUrl/:callbackUrl', setNoCache, nextIfError(controller.addVeramoCredential)) 
  appRouter.get('/issue/:did/:credential', setNoCache, nextIfError(controller.addCredentialByDidAndCredentialString)) 
  basicRouter.post('/revoke', setNoCache, body, nextIfError(controller.revokeCredentialByJWT))
  basicRouter.post('/verify', setNoCache, body, nextIfError(controller.verifyCredentialByJWT))
  
  return { appRouter, basicRouter }
}
export default endpoint