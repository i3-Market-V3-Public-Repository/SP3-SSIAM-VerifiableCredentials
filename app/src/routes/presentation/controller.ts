import { RequestHandler } from 'express'
import config from '@i3-market/config'

import { Issuer } from 'did-jwt-vc'
var Contract = require('web3-eth-contract');


export default class CredentialController {

  protected issuer: Issuer;
  protected smartcontract: any;
  protected identity: any;
  protected contractAddress: string;
  protected contract: any;

  constructor () { }

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

  
    /**   
   * 
   * POST /presentation/verify - verify a verifiable presentation
   */
  verifyPresentation: RequestHandler = async (req, res, next) => {

    console.log(req.body)
    res.send(req.body)
  }

}
