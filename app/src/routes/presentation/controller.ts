import { RequestHandler } from 'express'
//import { Credentials, SimpleSigner } from 'uport-credentials'
//import { getResolver } from 'ethr-did-resolver'
//import { Resolver } from 'did-resolver'
// import { decodeJWT } from "did-jwt"

import logger from '../../logger'
import config from '../../config'
import { SocketHandler } from '../../ws/utils'
import WebSocketServer from '../../ws'


// const transports = require('uport-transports').transport
// const message = require('uport-transports').message.util

//import { EthrDID } from 'ethr-did'
import { Issuer } from 'did-jwt-vc'
//import { JwtCredentialPayload, createVerifiableCredentialJwt } from 'did-jwt-vc'

// import { EthrCredentialRevoker } from 'ethr-status-registry'
// import { sign } from 'ethjs-signer'
// const didJWT = require('did-jwt')

//const web3 = require("web3");
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
    
    this.identity = await config.identityPromise;
    this.smartcontract = {
      "abi": [
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "address",
            "name": "issuer",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "bytes32",
            "name": "digest",
            "type": "bytes32"
          }
        ],
        "name": "Revoked",
        "type": "event"
      },
      {
        "constant": false,
        "inputs": [
          {
            "internalType": "bytes32",
            "name": "digest",
            "type": "bytes32"
          }
        ],
        "name": "revoke",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "internalType": "address",
            "name": "issuer",
            "type": "address"
          },
          {
            "internalType": "bytes32",
            "name": "digest",
            "type": "bytes32"
          }
        ],
        "name": "revoked",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      }
    ]
  };
    
    Contract.setProvider(config.rpcUrl); 
    this.contractAddress = config.smartContractRegistry;
    this.contract = new Contract(this.smartcontract.abi, this.contractAddress);

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
   * 
   * POST /presentation/verify - verify a verifiable presentation
   */
  verifyPresentation: RequestHandler = async (req, res, next) => {

    console.log(req.body)
    res.send(req.body)
  }

}
