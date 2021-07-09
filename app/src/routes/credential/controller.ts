import { RequestHandler } from 'express'
import { Credentials, SimpleSigner } from 'uport-credentials'
import { getResolver } from 'ethr-did-resolver'
import { Resolver } from 'did-resolver'
// import { decodeJWT } from "did-jwt"

import logger from '../../logger'
import config from '../../config'
import { SocketHandler } from '../../ws/utils'
import WebSocketServer from '../../ws'

import { agent } from './agent'
// const transports = require('uport-transports').transport
// const message = require('uport-transports').message.util

import { EthrDID } from 'ethr-did'
import { Issuer } from 'did-jwt-vc'
import { JwtCredentialPayload, createVerifiableCredentialJwt } from 'did-jwt-vc'

// import { EthrCredentialRevoker } from 'ethr-status-registry'
// import { sign } from 'ethjs-signer'
// const didJWT = require('did-jwt')

interface SocketParams {
  uid: string
}

interface SocketData {
  hello: string
}

export default class InteractionController {

  protected credentials: Credentials

  constructor (protected wss: WebSocketServer) { }

  public async initialize () {
    const providerConfig = { rpcUrl: 'https://rinkeby.infura.io/ethr-did' }
    const identity = await config.identityPromise
    this.credentials = new Credentials({
      did: identity.did,
      signer: SimpleSigner(identity.privateKey),
      resolver: new Resolver(getResolver(providerConfig))
    })
  }

  // WebSocket Methods
  socketConnect: SocketHandler<SocketParams> = async (socket, req) => {  
    console.log('socket connect')  
    console.log(req.params)
    socket.tag(req.params.uid)
  }

  socketMessage: SocketHandler<SocketParams, SocketData> = async (socket, req) => {
    logger.debug('Message socket')
    const json = req.json()
    console.log(json.hello)
  }

  socketClose: SocketHandler<SocketParams> = async () => {
    logger.debug('Close socket')
  }

  /**
   * GET /credential/{did}/{credential} - callback to create credential using Veramo framework
   */
  addCredentialByDidAndCredentialString: RequestHandler = async (req, res, next) => {
    
    let credentialPayload = JSON.parse(req.params.credential)
    credentialPayload.id = req.params.did

    /* Create an identifier and optionally link to an existing user */
    const user = await agent.didManagerGetOrCreate({
      alias: 'VCservice'
    })

    const credential = await agent.createVerifiableCredential({
      credential: {
        issuer: { id: user.did },
        credentialSubject: credentialPayload
      },
      proofFormat: 'jwt',
      save: false
    })

    console.log(credential)
    res.send(credential)
  
  }

  /**
   * GET /credential/issue/{credential} - create a new credential 
   */
  addVeramoCredential: RequestHandler = async (req, res, next) => {    
    return res.render('create_veramo_credential', {title: '', credential: req.params.credential});
  }

  /**
   * POST /credential/issue/{did} - create a new credential  
   */
  addCredentialByDid: RequestHandler = async (req, res, next) => {

    const identity = await config.identityPromise;
    
    const issuer: Issuer = new EthrDID({
      identifier: identity.did,    
      privateKey: identity.privateKey,
      rpcUrl: 'https://rinkeby.infura.io/v3/8a581af7416b4e7681d1f871b6945281',
      chainNameOrId: 'rinkeby'      
    }) as Issuer;

    const vcPayload: JwtCredentialPayload = {
      sub: req.params.did,
      nbf: Math.floor(new Date().getTime() / 1000),
      vc: {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiableCredential'],
        credentialSubject: req.body
      }
    }
    
    const vcJwt = await createVerifiableCredentialJwt(vcPayload, issuer)    
    res.send(vcJwt)
  }

  /**   
   * POST /credential/revoke - nel body il JWT
   *   
   */      
  revokeCredentialByJWT: RequestHandler = async (req, res, next) => {

    console.log('req.body')
    console.log(req.body)
    res.send("missing integration with the smart contract in which to mark the credential as revoked")
    /*
    const identity = await config.identityPromise;    
    const privateKey = '0x' + identity.privateKey // '0x<Issuer Private Key>'
    const ethSigner = (rawTx: any, cb: any) => cb(null, sign(rawTx, privateKey))

    // const credential = '<JWT token with credentialStatus>' //TODO: prenderlo dal body    
    // FIXME: su questo manca il credential status
    const credential = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJpYXQiOjE1ODg5MjIyMDEsImNyZWRlbnRpYWxTdGF0dXMiOnsidHlwZSI6IkV0aHJTdGF0dXNSZWdpc3RyeTIwMTkiLCJpZCI6InJpbmtlYnk6MHg5N2ZkMjc4OTJjZGNEMDM1ZEFlMWZlNzEyMzVjNjM2MDQ0QjU5MzQ4In0sImlzcyI6ImRpZDpldGhyOjB4NTRkNTllM2ZmZDc2OTE3ZjYyZGI3MDJhYzM1NGIxN2YzODQyOTU1ZSJ9.0sLZupOnyrdZPQAhtfa2eP_2HN_FELJu_clbXBrk9SgaU_ZO0izjDLTnNkip9RVM6ED0nLznfT35XHk6_C9S_Q' 

    const revoker = new EthrCredentialRevoker({ infuraProjectId: 'https://rinkeby.infura.io/ethr-did' }) //TODO: metto il mio progetto
    const txHash = await revoker.revoke(credential, ethSigner)
    console.log('txHash')
    console.log(txHash)*/   
  }

  /**
   * POST /credential/verify - nel body il JWT
   */
  verifyCredentialByJWT: RequestHandler = async (req, res, next) => {

    console.log('req.body')
    console.log(req.body)
    res.send("missing integration with the smart contract in which to verify the credential status")

    // TODO:
    // - https://developer.uport.me/credentials/requestverification#request-verifications questo è per i ruoli nel login
    // - https://github.com/decentralized-identity/did-jwt prima questo
    // - https://github.com/uport-project/credential-status poi questo
    // - poi aggiungere controllo se è stata revocata usando https://github.com/uport-project/credential-status

    /*
    console.log('claim to verify: ' + req.params.claim)    

    const providerConfig = { rpcUrl: 'https://rinkeby.infura.io/ethr-did' }   
    const identity = await config.identityPromise
    console.log('identity: ' + JSON.stringify(identity))
    const credentials = new Credentials({      
      did: 'did:ethr:0x31486054a6ad2c0b685cd89ce0ba018e210d504e', //did in input
      //did: req.params.did, //did in input
      signer: SimpleSigner('ef6a01d0d98ba08bd23ee8b0c650076c65d629560940de9935d0f46f00679e01'), 
      resolver: new Resolver(getResolver(providerConfig))
    })

    credentials.createDisclosureRequest({
      verified: [req.params.claim],
      callbackUrl: '/credential/verify/callback'
    }).then(requestToken => {

      console.log(didJWT.decodeJWT(requestToken))  //log request token to console
      const uri = message.paramsToQueryString(message.messageToURI(requestToken), {callback_type: 'post'})
      const qr =  transports.ui.getImageDataURI(uri)
      console.log(qr)
    })*/
  }

  /**
   * Get the list of the credential
   */
  getCredentialList: RequestHandler = async (req, res, next) => {
    res.send(['to be implemented asap'])
  }

}
