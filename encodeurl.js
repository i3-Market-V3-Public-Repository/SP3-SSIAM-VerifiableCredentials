

let verifiableClaimOfTheCredential = {
	"claim": "example",
    "project": "i3market",
    "usertype": "provider",
    "company": "gft",
    "service": "car",
    "demo":"09072021"
}

console.log('\n'+encodeURIComponent(JSON.stringify(verifiableClaimOfTheCredential)));

// http://localhost:4000/credential/issue/