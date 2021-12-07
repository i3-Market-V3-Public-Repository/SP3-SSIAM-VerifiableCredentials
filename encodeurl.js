let verifiableClaimOfTheCredential = {
    "name": "string",
    "description": "string",
    "organization": {
      "name": "optional_field",
      "description": "optional_field",
      "address": "optional_field",
      "contactPoint": "optional_field"
    }
  }
let url = "https://www.google.it"

console.log('\nCredential:\t'+encodeURIComponent(JSON.stringify(verifiableClaimOfTheCredential)));
console.log('\nURL:\t'+encodeURIComponent(JSON.stringify(url)));
