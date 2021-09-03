import { RequestHandler } from 'express'

export default class IssuerController {

  

  constructor () { }


  /**
  * Subscribe a new issuer
  */
  subscribeIssuer: RequestHandler = async (req, res, next) => {
    res.send('subscription error: missing rpc url of the blockchain')  
  }
 
  /**
  * Unsubscribe a new issuer
  */
   unsubscribeIssuer: RequestHandler = async (req, res, next) => {
    res.send('unsubscription error: missing rpc url of the blockchain')  
  }


}