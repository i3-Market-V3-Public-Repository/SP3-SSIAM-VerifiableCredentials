import { RequestHandler } from 'express'

import config from '../../config'

var Contract = require('web3-eth-contract');

export default class IssuerController {

  protected smartcontract: any;
  protected identity: any;
  protected contractAddress: string;
  protected contract: any;

  constructor () { }

  public async initialize () {

    this.identity = await config.identityPromise;    
    this.smartcontract = await config.smartcontractAbiPromise;
    Contract.setProvider(config.rpcUrl); 
    this.contractAddress = config.smartContractRegistry;
    this.contract = new Contract(this.smartcontract.abi, this.contractAddress);
  }

  /**
  * Subscribe a new issuer
  */
  subscribeIssuer: RequestHandler = async (req, res, next) => {
    
    try {
      
      // Call the smart contract function 
      let response = await this.contract.methods.addTrusted(this.identity.did).send({ from: this.identity.did })     
      res.send({
        status: response.status,
        message: 'issuer successfully subscribed',        
        transactionHash: response.transactionHash,
        blockNumber: response.blockNumber,
        transactionSignature: response.events.Trusted.signature
      })

    } catch (error) {

      res.status(500).send({ 
        error: 'error: something went wrong while executing the transaction', 
        log: error
      })

    }

  }
 
  /**
  * Unsubscribe an issuer
  * 
  * GET /issuer/unsubscribe
  */
  unsubscribeIssuer: RequestHandler = async (req, res, next) => {
    
    try {
      
      // Call the smart contract function 
      let response = await this.contract.methods.removeTrusted(this.identity.did).send({ from: this.identity.did })     
      res.send({
        status: response.status,
        message: 'issuer successfully unsubscribed',        
        transactionHash: response.transactionHash,
        blockNumber: response.blockNumber,
        transactionSignature: response.events.Trusted.signature
      })

    } catch (error) {

      res.status(500).send({ 
        error: 'error: something went wrong while executing the transaction', 
        log: error
      })

    }

  }


}