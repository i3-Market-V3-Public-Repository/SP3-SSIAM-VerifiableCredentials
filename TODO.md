### OPEN POINTS
-   Identity of the VC service
### TODO OIDC provider

-   Remove all occurrences of uPort because they generate a collision with Veramo during image creation
-   Verify a presentation using the VC service API during the authorization code flow
-   Specify trusted issuer in the scope field when initializing the auth code flow
-   Improve authentication page, adding i3market logo and fixing the CSS in general
-   Error management: report errors type (e.g. credential not disclosed / credential revoked)
-   Build and deploy production image
-   Aggiungere API su dev portal (entro dicembre)

### TODO VC service

-   Fix identity creation (identity.json should have the besu address an PK)
    non così
        {"did":"did:ethr:0x2e3592788eb9154914f87e4bb82011042aad5da8","privateKey":"d795f29dec1cfeb9323c7929a0620492750175b4b38e06f25d925666cfcbea89"}
    ma come in identity.json
-   API get /verify/presentation: from a presentation, check if all credentials inside are trusted (used by OIDC)  
    NOTE: to evaluate if Veramo can verify a Credentials by itself
-   API get /credential: get the issued credential list for a specific DID
-   Merge keycloak-token feature developed by Telesto from branch veramo/keycloak-authorization-middleware
-   Improve authentication page, adding i3market logo and fixing the CSS in general
-   Remove all uPort occurrences
-   Controllare API e docs su dev portal (entro dicembre)

### GENERAL

-   Provide sequence diagram with difference between uPort flow and Veramo + wallet flow for authentication and credentials issuing

### INFO
-   VC service did (issuer): 0x2e3592788eb9154914f87e4bb82011042aad5da8
