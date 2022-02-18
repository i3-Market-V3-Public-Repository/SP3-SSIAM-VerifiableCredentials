import { RequestHandler } from 'express'
import { ethers } from 'ethers'
import { IIdentifier } from '@veramo/core'
import { agent } from './../credential/agent'
import config from '../../config'
import logger from '../../logger'

const web3 = require("web3");
var Contract = require('web3-eth-contract');
export default class IssuerController {

  protected smartcontract: any;
  protected identity: any;
  protected contractAddress: string;
  protected contract: any;
  protected veramoIdentity: IIdentifier;
  protected provider: ethers.providers.JsonRpcProvider;

  constructor () { }

  public async initialize () {

    // initialize issuer registry contract
    this.identity = await config.identityPromise;    
    this.smartcontract = {
      "abi": [
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "address",
            "name": "truster",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "address",
            "name": "issuer",
            "type": "address"
          }
        ],
        "name": "Trusted",
        "type": "event"
      },
      {
        "constant": false,
        "inputs": [
          {
            "internalType": "address",
            "name": "_wallet",
            "type": "address"
          }
        ],
        "name": "addIssuer",
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
            "name": "_wallet",
            "type": "address"
          }
        ],
        "name": "isTrusted",
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
      },
      {
        "constant": false,
        "inputs": [
          {
            "internalType": "address",
            "name": "_wallet",
            "type": "address"
          }
        ],
        "name": "removeIssuer",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ]
  };
    Contract.setProvider(config.rpcUrl); 
    this.contractAddress = config.smartContractIssuers;
    this.contract = new Contract(this.smartcontract.abi, this.contractAddress);
    const rpcUrl = config.rpcUrl;

    // initialize ethers
    this.provider = new ethers.providers.JsonRpcProvider(rpcUrl);

    // initialize veramo identity
    try {
      this.veramoIdentity = await agent.didManagerGetByAlias({
        alias: 'VCservice',
        provider: 'did:ethr:i3m'
      })        
    } catch (error) {      
      this.veramoIdentity = await agent.didManagerImport({
        did: `did:ethr:i3m:${this.identity.did}`,
        keys: [{
          type: 'Secp256k1',
          kid: this.identity.did.substring(2),
          publicKeyHex: this.identity.did.substring(2),
          privateKeyHex: this.identity.privateKey.substring(2),
          kms: 'local'
        }],
        controllerKeyId: this.identity.did.substring(2),
        provider: 'did:ethr:i3m',
        alias: 'VCservice',
        services: []
      })
    }
  }
  

  /**
  * Subscribe a new issuer
  */
  subscribeIssuer: RequestHandler = async (req, res, next) => {
    
    try {
      
      const fromAddress = `0x${this.veramoIdentity.controllerKeyId}`
      const nonce = await this.provider.getTransactionCount(fromAddress)

      const txData = {        
        nonce,
        gasLimit: web3.utils.toHex(2500000),
        gasPrice: web3.utils.toHex(10e9), // 10 Gwei
        to: this.contractAddress,
        from: fromAddress,
        data: this.contract.methods.addIssuer(fromAddress).encodeABI()
      }
      
      const signedTransaction = await agent.keyManagerSignEthTX({
        kid: this.veramoIdentity.controllerKeyId ?? '',
        transaction: txData
      })

      const transactionResponse = await this.provider.sendTransaction(signedTransaction);

      logger.debug('transactionResponse')
      logger.debug(JSON.stringify(transactionResponse))

      const receipt = await transactionResponse.wait();

      logger.debug('receipt')
      logger.debug(JSON.stringify(receipt))

      res.send({
        message: 'issuer subscribed successfully',
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        blockHash: receipt.blockHash,
        cumulativeGasUsed: receipt.cumulativeGasUsed
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
      
      const fromAddress = `0x${this.veramoIdentity.controllerKeyId}`
      const nonce = await this.provider.getTransactionCount(fromAddress)

      const txData = {        
        nonce,
        gasLimit: web3.utils.toHex(2500000),
        gasPrice: web3.utils.toHex(10e9), // 10 Gwei
        to: this.contractAddress,
        from: fromAddress,
        data: this.contract.methods.removeIssuer(fromAddress).encodeABI()
      }
      
      const signedTransaction = await agent.keyManagerSignEthTX({
        kid: this.veramoIdentity.controllerKeyId ?? '',
        transaction: txData
      })

      const transactionResponse = await this.provider.sendTransaction(signedTransaction);

      logger.debug('transactionResponse')
      logger.debug(JSON.stringify(transactionResponse))

      const receipt = await transactionResponse.wait();

      logger.debug('receipt')
      logger.debug(JSON.stringify(receipt))

      res.send({
        message: 'issuer unsubscribed successfully',
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        blockHash: receipt.blockHash,
        cumulativeGasUsed: receipt.cumulativeGasUsed
      })

    } catch (error) {

      res.status(500).send({ 
        error: 'error: something went wrong while executing the transaction', 
        log: error
      })

    }

  }

  /**
   * Verify if an issuer is trusted
   * 
   * POST /issuer/verify 
   */
  verifyTrustedIssuer: RequestHandler = async (req, res, next) => {

    try {
      
      const issuer = `0x${this.veramoIdentity.controllerKeyId}`
      
      // Call the smart contract function 
      let blockNumber = await this.contract.methods.isTrusted(issuer).call()

      if(blockNumber === '0') {        
        res.send({ 
          status: 1,
          message: 'untrusted issuer' 
        })
      } else {
        res.send({ 
          status: 0,
          message: 'trusted issuer', 
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


}