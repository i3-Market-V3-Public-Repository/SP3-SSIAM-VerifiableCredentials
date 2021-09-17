import { RequestHandler } from 'express'
//import { Credentials, SimpleSigner } from 'uport-credentials'
//import { getResolver } from 'ethr-did-resolver'
//import { Resolver } from 'did-resolver'
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

const web3 = require("web3");
var Contract = require('web3-eth-contract');
//const config = require('./config')



interface SocketParams {
  uid: string
}

interface SocketData {
  hello: string
}

export default class CredentialController {

  //protected credentials: Credentials
  protected issuer: Issuer;
  protected smartcontract: any;
  protected identity: any;
  protected contractAddress: string;
  protected contract: any;

  constructor (protected wss: WebSocketServer) { }

  public async initialize () {
    //const providerConfig = { rpcUrl: 'https://rinkeby.infura.io/ethr-did' }
    this.identity = await config.identityPromise;
    this.smartcontract = await config.smartcontractAbiPromise;
    /*this.credentials = new Credentials({
      did: identity.did,
      signer: SimpleSigner(identity.privateKey),
      resolver: new Resolver(getResolver(providerConfig))
    })*/
    //const identity = await config.identityPromise;
    
    /*const issuer: Issuer = new EthrDID({
      identifier: identity.did,    
      privateKey: identity.privateKey,
      //rpcUrl: 'https://rinkeby.infura.io/v3/8a581af7416b4e7681d1f871b6945281',
      rpcUrl: 'http://127.0.0.1:8545',
      //chainNameOrId: 'rinkeby'      
      chainNameOrId: 'ganache'      
    }) as Issuer;*/

    //Contract.setProvider(config.rpcUrl);
    Contract.setProvider(config.rpcUrl); 
    this.contractAddress = config.smartContractRegistry;
    this.contract = new Contract(this.smartcontract.abi, this.contractAddress);
    this.issuer = new EthrDID({
      identifier: this.identity.did,
      privateKey: this.identity.privateKey
    }) as Issuer;
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
   * Veramo
   * 
   * GET /credential/issue/{credential} - render the page to create a new credential 
   */
   addVeramoCredential: RequestHandler = async (req, res, next) => {    

    return res.render('create_veramo_credential', {
      title: '', 
      credential: req.params.credential
    });

  }

  /**
   * Veramo
   * 
   * GET /credential/{did}/{credential} - callback to create credential using Veramo framework
   */
  addCredentialByDidAndCredentialString: RequestHandler = async (req, res, next) => {
    
    let credentialPayload = JSON.parse(req.params.credential)
    credentialPayload.id = req.params.did

    /*
    TODO: check correctness of this
    Create an identifier and optionally link to an existing user 
    const user = await agent.didManagerGetOrCreate({
      alias: 'VCservice'
    })*/

    const credential = await agent.createVerifiableCredential({
      credential: {
        issuer: { id: /*user.did*/ this.issuer.toString() },
        credentialSubject: credentialPayload
      },
      proofFormat: 'jwt',
      save: false
    })

    console.log(credential)
    res.send(credential)
  
  }

  /**   
   * POST /credential/revoke - nel body il JWT
   *   
   */      
  revokeCredentialByJWT: RequestHandler = async (req, res, next) => {

    try {

      // Generate the digest from the JWT of the credential
      const digest = web3.utils.sha3(req.body.credentialJwt).toString('hex')

      // Call the smart contract function 
      let response = await this.contract.methods.revoke(digest).send({ from: this.identity.did })  
      res.send({
        status: response.status,
        message: 'credential successfully revoked',        
        transactionHash: response.transactionHash,
        blockNumber: response.blockNumber,
        transactionSignature: response.events.Revoked.signature
      })
      
    } catch (error) {

      res.status(500).send({ 
        error: 'error: something went wrong while executing the transaction', 
        log: error
      })

    }
 
  }

  /**
   * POST /credential/verify - nel body il JWT
   */
  verifyCredentialByJWT: RequestHandler = async (req, res, next) => {

    try {

      // Generate the digest from the JWT of the credential
      const digest = web3.utils.sha3(req.body.credentialJwt).toString('hex')

      // Call the smart contract function 
      let blockNumber = await this.contract.methods.revoked(req.body.credentialIssuer, digest).call()

      if(blockNumber === '0') {
        // TODO: controllare anche che sia trusted issuer
        res.send({ 
          status: true,
          message: 'credential not revoked' 
        })
      } else {
        res.send({ 
          status: true,
          message: 'credential revoked', 
          transactionNumber: blockNumber
        })
      }  

    } catch (error) {

      res.status(500).send({ 
        error: 'error: something went wrong while executing the transaction', 
        log: error
      })

    }
 
  }

  /**
   * Get the list of the credential
   */
  getCredentialList: RequestHandler = async (req, res, next) => {
    res.send(['to be implemented asap'])
  }

  /**
   * uPort flow
   * 
   * POST /credential/issue/{did} - create a new credential
   */
   addCredentialByDid: RequestHandler = async (req, res, next) => {

    const vcPayload: JwtCredentialPayload = {
      sub: req.params.did,
      nbf: Math.floor(new Date().getTime() / 1000),
      vc: {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiableCredential'],
        credentialSubject: req.body
      }
    }
    
    const vcJwt = await createVerifiableCredentialJwt(vcPayload, this.issuer)    
    res.send(vcJwt)
  }

}
