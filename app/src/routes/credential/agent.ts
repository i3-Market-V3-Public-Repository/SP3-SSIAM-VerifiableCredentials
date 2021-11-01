// Core interfaces
import { createAgent, IDIDManager, IKeyManager/*, IResolver, IDataStore, IMessageHandler*/} from '@veramo/core'

// Core identity manager plugin
import { DIDManager } from '@veramo/did-manager'

// Ethr did identity provider
import { EthrDIDProvider } from '@veramo/did-provider-ethr'

// Web did identity provider
import { WebDIDProvider } from '@veramo/did-provider-web'

// Core key manager plugin
import { KeyManager } from '@veramo/key-manager'


// Custom key management system for RN
import { KeyManagementSystem } from '@veramo/kms-local'

// import { ISelectiveDisclosure, SelectiveDisclosure, SdrMessageHandler } from '@veramo/selective-disclosure'

// 
// import { MessageHandler } from '@veramo/message-handler'
// import { JwtMessageHandler } from '@veramo/did-jwt'

//
import { CredentialIssuer, ICredentialIssuer/*, W3cMessageHandler */} from '@veramo/credential-w3c'

// Custom resolvers
// import { DIDResolverPlugin } from '@veramo/did-resolver'
import { Resolver } from 'did-resolver'
import { getResolver as ethrDidResolver } from 'ethr-did-resolver'
import { getResolver as webDidResolver } from 'web-did-resolver'

// Storage plugin using TypeOrm
import { Entities, KeyStore, DIDStore/*, IDataStoreORM , DataStore, DataStoreORM*/ } from '@veramo/data-store'

// TypeORM is installed with `@veramo/data-store`
import { createConnection } from 'typeorm'

// This will be the name for the local sqlite database for demo purposes
const DATABASE_FILE = 'database.sqlite'

const dbConnection = createConnection({
  type: 'sqlite',
  database: DATABASE_FILE,
  synchronize: true,
  logging: ['error', 'info', 'warn'],
  entities: Entities,
})

// Veramo config
 
const RINKEBY_PROVIDER_DATA = {
  defaultKms: 'local',
  network: 'rinkeby',
  rpcUrl: 'https://rinkeby.infura.io/ethr-did'
}

const I3M_PROVIDER_DATA = {
  defaultKms: 'local',
  network: 'i3m',
  rpcUrl: 'http://95.211.3.250:8545'
}

const GANACHE_PROVIDER_DATA = {
  defaultKms: 'local',
  network: 'ganache',
  rpcUrl: 'http://127.0.0.1:8545'
}

const resolvers = {
  ...ethrDidResolver({
    networks: [I3M_PROVIDER_DATA, RINKEBY_PROVIDER_DATA, GANACHE_PROVIDER_DATA]
      .map(({ network, rpcUrl }) => ({
        name: network,
        rpcUrl
      }))
  }),
  ...webDidResolver()
}

export const resolver = new Resolver(resolvers)

export const agent = createAgent<
  IDIDManager & IKeyManager & ICredentialIssuer /*& IDataStore & IDataStoreORM & IResolver &
  ISelectiveDisclosure & IMessageHandler  & IDataStore &
  IDataStoreORM*/
>({
  plugins: [
    new KeyManager({
      store: new KeyStore(dbConnection),
      kms: {
        local: new KeyManagementSystem(),
      },
    }),
    new DIDManager({
      store: new DIDStore(dbConnection),
      defaultProvider: 'did:ethr:rinkeby',
      //defaultProvider: 'did:ethr:i3m',
      //defaultProvider: 'did:ethr:ganache',
      providers: {
        'did:ethr:rinkeby': new EthrDIDProvider(RINKEBY_PROVIDER_DATA),
        'did:ethr:i3m': new EthrDIDProvider(I3M_PROVIDER_DATA),
        'did:ethr:ganache': new EthrDIDProvider(GANACHE_PROVIDER_DATA),
        'did:web': new WebDIDProvider({ defaultKms: 'local', })
      },
    }),
    new CredentialIssuer()
    
    /*,
    new SelectiveDisclosure(),
    new DataStore(dbConnection),
    new DataStoreORM(dbConnection),
    new MessageHandler({
      messageHandlers: [
        new JwtMessageHandler(),
        new SdrMessageHandler(),
        new W3cMessageHandler(),
      ]
    }),
    new DIDResolverPlugin({
      resolver
    }),
    */
  ],
})
