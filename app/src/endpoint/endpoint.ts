import { Express, Router as ExpressRouter } from 'express'
import { CanBePromise } from 'oidc-provider'

export interface Endpoint {
  appRouter?: ExpressRouter
  basicRouter?: ExpressRouter
}

export type EndpointLoader = (app: Express) => CanBePromise<Endpoint>
