web3 = require("web3");

const credential = "some (JWT issued by `issuer`) popopopopopopo but it can be any data since it gets hashed"

// generate sha3 digest
const digest = web3.utils.sha3(credential).toString('hex')
console.log(digest, digest.length)
