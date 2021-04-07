import * as path from 'path'
import express from 'express'
import * as http from 'http'
import * as ngrok from 'ngrok'

import config from './config'
import logger, { loggerMiddleware } from './logger'
import { addEndpoint } from './endpoint'
import WebSocketServer from './ws'
import { jwks, did } from './security'

import { apiSpecEndpoint, credentialEndpoint, didEndpoint } from './routes'
/// ///////

async function listenPromise (server: http.Server, port: number): Promise<void> {
  return await new Promise((resolve) => server.listen(port, () => {
    resolve()
  }))
}

/**
 * Main function: the application entrypoint!
 */
export async function main (): Promise<void> {


  // Intialize jwks
  await jwks({ keys: ['RS256', 'PS256', 'ES256', 'EdDSA'] })

  // Create a new identity if not provided
  await did()

  // Initialize express
  const app = express()
  const server = http.createServer(app)
  const wss = new WebSocketServer(server)

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
      next()
    })
  }

  // Add endpoints
  addEndpoint(app, wss, '/api-spec', await apiSpecEndpoint(app, wss))
  addEndpoint(app, wss, '/credential', await credentialEndpoint(app, wss))
  addEndpoint(app, wss, '/did', await didEndpoint(app, wss))


  // Add static files (css and js)
  const publicDir = path.resolve(__dirname, 'public')
  app.use('/', express.static(publicDir))

  // Listen
  const port = config.port
  await listenPromise(server, port)

  // Connect to ngrok
  let publicUri = config.publicUri
  if (config.useNgrok) {
    publicUri = await ngrok.connect({ addr: port })
  }

  // Log connection information
  logger.info(`Application is listening on port ${config.port}`)  
  logger.info(`OpenAPI browsable spec at ${publicUri}/api-spec/ui`)
}

export function onError (reason?: Error): void {
  logger.error(`Error ${reason !== undefined ? reason?.message : 'unknown'}`)
  if (reason !== undefined) {
    console.log(reason)
  }
}

