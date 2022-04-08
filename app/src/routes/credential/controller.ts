import { RequestHandler } from 'express'

import logger from '@i3-market/logger'
import config from '@i3-market/config'

import { agent } from './agent'
import { Issuer } from 'did-jwt-vc'
import { IIdentifier } from '@veramo/core'

import { ethers } from 'ethers'
import { decodeJWT } from 'did-jwt'

const web3 = require("web3");
var Contract = require('web3-eth-contract');

export default class CredentialController {

  protected issuer: Issuer;
  protected smartcontract: any;
  protected smartcontractIssuer: any;
  protected identity: any;
  protected contractAddress: string;
  protected contractAddressIssuer: string;
  protected contract: any;
  protected contractIssuer: any;
  protected veramoIdentity: IIdentifier;
  protected provider: ethers.providers.JsonRpcProvider;

  constructor () { }

  public async initialize () {
    
    // initialize credential registry contract
    Contract.setProvider(config.rpcUrl); 
    this.identity = await config.identityPromise;
    this.smartcontract = await config.smartcontractAbiPromise;
    console.log(this.smartcontract)

    this.contractAddress = config.smartContractRegistry;
    this.contract = new Contract(this.smartcontract.abi, this.contractAddress);
    
    this.smartcontractIssuer = await config.issuerRegistryAbiPromise;    
    this.contractAddressIssuer = config.smartContractIssuers;
    console.log(this.smartcontractIssuer)

    this.contractIssuer = new Contract(this.smartcontractIssuer.abi, this.contractAddressIssuer);

    // initialize ethers js rpc
    this.provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);

    // initialize veramo identity
    try {
      this.veramoIdentity = await agent.didManagerGetByAlias({
        alias: 'VCservice',
        provider: 'did:ethr:i3m'
      })
      logger.info('Found an identity in the Veramo database')
    } catch (error) {
      logger.info(error)
      logger.info('Creating a new Veramo identity from identity.json ...')

      this.veramoIdentity = await agent.didManagerImport({
        
        did: `did:ethr:i3m:${this.identity.did.substring(9)}`,
        keys: [{
          type: 'Secp256k1',
          kid: this.identity.did.substring(11),
          publicKeyHex: this.identity.did.substring(11),
          privateKeyHex: this.identity.privateKey,
          kms: 'local'
        }],
        controllerKeyId: this.identity.did.substring(11),
        provider: 'did:ethr:i3m',
        alias: 'VCservice',
        services: []
      })      
      logger.info('New veramo identity created')
    }
    
  }

  /**
   * Veramo
   * 
   * GET /credential/issue/{credential}/callbackUrl/{callbackUrl} - render the HTML page that will communicate with the i3market wallet
   */
   addVeramoCredential: RequestHandler = async (req, res, next) => {    
    return res.render('issue_credential', {
      title: '', 
      credential: req.params.credential,
      callbackUrl: req.params.callbackUrl,
      backplaneContextPath: config.getBackplaneContextPath
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

    const credential = await agent.createVerifiableCredential({
      credential: {
        issuer: { id: this.veramoIdentity.did },
        credentialSubject: credentialPayload,
        credentialStatus: {
          id: config.rpcUrl, // rpc url of besu blockchain
          type: config.smartContractRegistry // address of credential revocation registry
        }
      },
      proofFormat: 'jwt',
      save: false
    })

    // console.log(credential)
    res.send(credential)
  }

  /**   
   * POST /credential/revoke - nel body il JWT
   *   
   */      
  revokeCredentialByJWT: RequestHandler = async (req, res, next) => {

    let decodedJWT;
    let credentialIssuer;

    // check if the credential passed in input is actually a W3C verifiable credential      
    try {

      decodedJWT = decodeJWT(req.body.credentialJwt)

      // remove blockchain prefix from address (e.g. did:ethr:rinkeby:) to extract the issuer address
      const index = decodedJWT.payload.iss.indexOf("0x")   
      credentialIssuer = decodedJWT.payload.iss.substring(index)
      console.log(credentialIssuer)      

    } catch (error) {

      res.status(500).send({ 
        error: 'error: invalid verifiable credential', 
        log: 'The jwt passed in input does not represent a W3C verifiable credential'
      })
    }     

    try {

      // Generate the digest from the JWT of the credential
      const digest = web3.utils.sha3(req.body.credentialJwt).toString('hex')
      
      const fromAddress = `0x${this.veramoIdentity.controllerKeyId}`
      const nonce = await this.provider.getTransactionCount(fromAddress)

      const txData = {        
        nonce,
        gasLimit: web3.utils.toHex(2500000),
        gasPrice: web3.utils.toHex(10e9), // 10 Gwei
        to: this.contractAddress,
        from: fromAddress,
        data: this.contract.methods.revoke(digest).encodeABI()
      }

      const signedTransaction = await agent.keyManagerSignEthTX({
        kid: this.veramoIdentity.controllerKeyId ?? '',
        transaction: txData
      })

      const transactionResponse = await this.provider.sendTransaction(signedTransaction);
      const receipt = await transactionResponse.wait();

      // logger.info('receipt')
      // logger.info(JSON.stringify(receipt))

      res.send({
        message: 'credential revoked successfully',
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        blockHash: receipt.blockHash,
        cumulativeGasUsed: receipt.cumulativeGasUsed
      })

    } catch (error) {
      logger.error(error)
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
      
    let decodedJWT;
    let credentialIssuer;

    // check if the credential passed in input is actually a W3C verifiable credential      
    try {

      decodedJWT = decodeJWT(req.body.credentialJwt)

      // remove blockchain prefix from address (e.g. did:ethr:rinkeby:) to extract the issuer address
      const index = decodedJWT.payload.iss.indexOf("0x")   
      credentialIssuer = decodedJWT.payload.iss.substring(index)      

    } catch (error) {

      res.status(500).send({ 
        error: 'error: invalid verifiable credential', 
        log: 'The jwt passed in input does not represent a W3C verifiable credential'
      })
    }     

    // Generate the digest from the JWT of the credential
    const digest = web3.utils.sha3(req.body.credentialJwt).toString('hex')

    const revoker = req.body.credentialIssuer ?? credentialIssuer;    

    try {
      // Call the smart contract function 
      let blockNumber = await this.contract.methods.revoked(revoker, digest).call()

      if(blockNumber === '0') {
        // credential valid, now check the if the credential issuer is valid, otherwise send an error (status 2)
        let blockNumberIssuer = await this.contractIssuer.methods.isTrusted(credentialIssuer).call()
        
        if(blockNumberIssuer === '0') {        
          res.send({ 
            status: 2,
            message: 'untrusted credential issuer' 
          })
        }

        console.log(blockNumberIssuer)
        res.send({ 
          status: 0,
          message: 'credential not revoked' 
        })
      } else {
        res.send({ 
          status: 1,
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


}
