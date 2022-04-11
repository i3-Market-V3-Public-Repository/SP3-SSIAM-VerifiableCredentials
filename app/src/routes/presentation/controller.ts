import { RequestHandler } from 'express'
// import config from '@i3-market/config'

// import { Issuer } from 'did-jwt-vc'
// var Contract = require('web3-eth-contract');


export default class PresentationController {

  /*
  protected issuer: Issuer;
  protected smartcontract: any;
  protected identity: any;
  protected contractAddress: string;
  protected contract: any;
  */ 
  constructor () { }

  public async initialize () {
    
    /*
    this.identity = await config.identityPromise;
    
    
    Contract.setProvider(config.rpcUrl); 
    this.contractAddress = config.smartContractRegistry;
    this.contract = new Contract(this.smartcontract.abi, this.contractAddress);
    */
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
