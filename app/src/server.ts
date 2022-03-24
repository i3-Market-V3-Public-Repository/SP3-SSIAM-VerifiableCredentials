import * as path from 'path'
import express from 'express'
import * as http from 'http'
import { URL } from 'url'

import config from './config'
import logger, { loggerMiddleware } from './logger'
import { addEndpoint } from './endpoint'
import { jwks, did } from './security'

import { apiSpecEndpoint, credentialEndpoint, issuerEndpoint, presentationEndpoint } from './routes'

async function listenPromise (server: http.Server, port: Number): Promise<void> {

  return await new Promise((resolve) => server.listen(port, () => {
    resolve()
  }))
}

/**
 * Main function: the application entrypoint!
 */
export async function main (): Promise<void> {

  if (config.isProd) {
    logger.info('Using production environment')
  }

  let port = config.port
  if(config.port === NaN) {
    port = 4200
  }

  // Connect to ngrok
  if (config.isProd && config.useNgrok) {
    throw new Error('You can\'t use NGROK in production. You may want to switch it off in your .env file')
  }
  if (config.useNgrok) {
    const ngrok = await import('ngrok')
    const ngrokUri = await ngrok.connect({ addr: port })
    config.ngrokUri = ngrokUri
  }

  // Initialise server comunications variables
  const publicUri = config.publicUri
  const url = new URL(publicUri)
  config.host = url.host

  // Intialize jwks
  await jwks({ keys: ['RS256', 'PS256', 'ES256', 'EdDSA'] })

  // Create a new identity if not provided
  await did()

  // Initialize express
  const app = express()
  const server = http.createServer(app)

  // View
  app.set('views', path.join(__dirname, 'views'))
  app.set('view engine', 'ejs')
  app.use(express.json())
  app.use(express.urlencoded({ extended: false }))


  // Add middlewares
  
  app.use(loggerMiddleware)
  /**
   * TODO:
   * Force proto https if reverse proxy. Header x-forwarded-proto must be setted by the proxy
   * Only use this option on development enviromnent!
   */
  if (config.reverseProxy && !config.isProd) {
    logger.warn('Setting up x-forwarded-proto header as https. Note that it should be only used in development!')
    app.use((req, res, next) => {
      req.headers['x-forwarded-proto'] = 'https'      
      req.headers.host = config.host
      next()
    })
  }

  // Add endpoints
  addEndpoint(app, `${config.getContextPath}/api-spec`, await apiSpecEndpoint(app))
  addEndpoint(app, `${config.getContextPath}/credential`, await credentialEndpoint(app))
  addEndpoint(app, `${config.getContextPath}/issuer`, await issuerEndpoint(app))
  addEndpoint(app, `${config.getContextPath}/presentation`, await presentationEndpoint(app))

  // Add static files (css and js)
  const publicDir = path.resolve(__dirname, 'public')
  app.use('/', express.static(publicDir))

  // Listen
  await listenPromise(server, port)

  // Log connection information
  logger.info(`Application is listening on port ${config.port}`)  
  logger.info(`OpenAPI JSON spec at ${publicUri}${config.getContextPath}/api-spec/openapi.json`)
  logger.info(`OpenAPI browsable spec at ${publicUri}${config.getContextPath}/api-spec/ui`)
}

export function onError (reason?: Error): void {
  logger.error(`Error ${reason !== undefined ? reason?.message : 'unknown'}`)
  if (reason !== undefined) {
    console.log(reason)
  }
}

