import { Express, Router as ExpressRouter } from 'express'
import { CanBePromise } from 'oidc-provider'

import WebSocketServer, { WebSocketRouter } from '../ws'

export interface Endpoint {
  appRouter?: ExpressRouter
  basicRouter?: ExpressRouter
  wsRouter?: WebSocketRouter
}

export type EndpointLoader = (app: Express, wss: WebSocketServer) => CanBePromise<Endpoint>
