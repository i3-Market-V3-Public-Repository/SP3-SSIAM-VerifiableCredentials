# Verifiable Credential service

This service manages verifiable credentials, allowing through APIs to issue, verify, revoke verifiable credentials in the W3C standard
# Build, install, deploy

Run the following command in the project root. The first time it will take a while (be patience), since it has to build images and download all the npn dependencies.

### Development
Before all, rename the file `template.env` to `.env`

```console
./docker-dev-start
```

The OAS documentation can be accessed on [http://localhost:4000/api-spec/ui](http://localhost:4000/api-spec/ui).

You can stop the container at any time with `Ctrl-C`.

If you want to delete and prune all the created images, containers, networks, volumes, just run

```console
./docker-dev-prune
```

### Production

Before all, rename the file `template.env` to `production.env`

Build the image for the production environment
```console
./docker-prod-build
```

Run the image using the docker-compose file
```console
docker-compose up
```

# API's usage

### Issue a credential

Usage:
> ```GET /issue/{credential}```
The {credential} parameter is a JSON encoded as a URL.
An example of a credentials payload can be:
```
{ 
  consumer: true
}
```

You can encode a JSON credential as a url in this way
`encodeURIComponent(JSON.stringify({ consumer: true })`

This APIs produces an HTML page that must be displayed on a browser. It is therefore necessary to redirect the URL of this API. The generated HTML page contains a script that communicates with the i3market wallet, which must be running on *localhost:8000*.
Following the rendering of this page, a notification will appear on the wallet asking you to select the identity (DID) on which to save the verifiable credential. After selecting it, it automatically generates the credential and sends it back to the i3market wallet. The wallet will present a new notification asking if you want to accept the credential. Upon acceptance, the credential will be saved and viewable in the wallet.

### Revoke a credential

Usage:
> ```POST /revoke```
With the following body
```
{
  "credentialJwt": "string"
}
```


This API takes a verifiable credential as input in the body, calculates the hash and registers it in the credential registry, on the i3market Besu blockchain

Swagger references [here](https://identity1.i3-market.eu/release2/vc/api-spec/ui/#/Credential/post_release2_vc_credential_revoke).

### Verify a credential

Usage:
> ```POST /verify```
With the following body
{
  "credentialJwt": "string",
  "credentialIssuer": "string"
}

This API checks whether a credential in JWT format is registered in the revocation registry.
The JWT of the verifiable credential and optionally the DID of the revoker you want to verify must be passed in the body. If the credentialIssuer, i.e. the revoker, it is not specified, it will be checked whether the issuer of the verifiable credential has revoked the credential or not.
This way you can check if the credential has been revoked from a specific DID or not.

Swagger references [here](https://identity1.i3-market.eu/release2/vc/api-spec/ui/#/Credential/post_release2_vc_credential_verify).


# Contributing

Pull requests are always appreciated.

# License

```
This is free and unencumbered software released into the public domain.
Anyone is free to copy, modify, publish, use, compile, sell, or distribute this software, either in source code form or as a compiled binary, for any purpose, commercial or non-commercial, and by any means.
In jurisdictions that recognize copyright laws, the author or authors of this software dedicate any and all copyright interest in the software to the public domain. We make this dedication for the benefit of the public at large and to the detriment of our heirs and successors. We intend this dedication to be an overt act of relinquishment in perpetuity of all present and future rights to this software under copyright law.


THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

For more information, please refer to <http://unlicense.org/>
```