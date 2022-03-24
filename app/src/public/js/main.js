/// <reference path="global.d.ts" />

(async function () {

  const main = async () => {

    /*
    const MAP = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
    const base58 = {
        encode: function(B,A){var d=[],s="",i,j,c,n;for(i in B){j=0,c=B[i];s+=c||s.length^i?"":1;while(j in d||c){n=d[j];n=n?n*256+c:c;c=n/58|0;d[j]=n%58;j++}}while(j--)s+=A[d[j]];return s},
        decode: function(S,A){var d=[],b=[],i,j,c,n;for(i in S){j=0,c=A.indexOf(S[i]);if(c<0)return undefined;c||b.length^i?i:b.push(0);while(j in d||c){n=d[j];n=n?n*58+c:c;c=n>>8;d[j]=n%256;j++}}while(j--)b.push(d[j]);return new Uint8Array(b)}
    }*/

    const sessionState = document.getElementById('session-state')
    const identityState = document.getElementById('identity-state')
    const credentialState = document.getElementById('credential-state')
    const walletState = document.getElementById('wallet-state')

    const { WalletProtocol, HttpInitiatorTransport, Session } = walletProtocol
    const { openModal, LocalSessionManager } = walletProtocolUtils
    const { WalletApi } = walletProtocolApi
    
    const transport = new HttpInitiatorTransport({ getConnectionString: openModal })
    const protocol = new WalletProtocol(transport)
    const sessionManager = new LocalSessionManager(protocol)


    sessionManager
    .$session
    .subscribe((session) => {
        sessionState.innerText = session !== undefined ? '1. i3Market wallet successfully paired' : 'Missing pairing with i3Market wallet'
        if(session !== undefined) {
            // console.log('enabling flow')  
            const api = new WalletApi(session)   
                  
            // Retrieve identity from the Wallet
            api.identities.select().then(result => {
              // console.log(result)
              identityState.innerText = '2. Identity successfully disclosed'
              let did = result.did        
              
              // Call to VC service to create the Verifiable Credential
              const response = new Promise(resolve => {
                var xhr = new XMLHttpRequest();
                xhr.open("GET", backplaneContextPath + '/credential/issue/' + did + '/' + credential, true);
                xhr.onload = function(e) {
                  resolve(xhr.response);
                };
                xhr.onerror = function () {
                  resolve(undefined);
                  console.error("** An error occurred during the XMLHttpRequest");
                };
                xhr.send();
              }) 
              response.then(result => {
                credentialState.innerText = '3. Credential successfully generated'
                let credential = JSON.parse(result)  
                let credentialToPost = {}                                      
                credentialToPost.resource = credential
                credentialToPost.type = 'VerifiableCredential'
                credentialToPost.identity = credential.credentialSubject.id
                // console.log(credentialToPost)

                // Store the VC in the wallet
                api.resources.create(credentialToPost).then(walletResponse => {
                  // console.log(walletResponse)
                  walletState.innerText = '4. Credential successfully stored in the wallet'
                  let url = decodeURIComponent(callbackUrl)
                  document.location.href = url
                }).catch(err => { 
                  console.log(err)
                  walletState.innerText = '4. Error in the credential storing in the wallet' 
                })

              }).catch(err => { 
                credentialState.innerText = '3. Error in the credential generation'
                console.log(err) 
              })
              
            }).catch(err => {
              identityState.innerText = '2. Error in the disclosure of the identity' 
              console.log(err) 
            })

        } else {
            console.log('waiting for pairing...')
            return
        }
        
    })
    
    await sessionManager.loadSession()
    await sessionManager.createIfNotExists()
  }
  window.onload = main
  
})()
