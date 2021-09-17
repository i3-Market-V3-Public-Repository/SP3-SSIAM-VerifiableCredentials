import * as fs from 'fs'
import * as path from 'path'
import { promisify } from 'util'
import { Credentials } from 'uport-credentials'
import { randomFillSync } from 'crypto'

type Identity = ReturnType<typeof Credentials.createIdentity>
type ConvertFunction<T> = (value: string) => T

const readFilePromise = promisify(fs.readFile)
// type Identity = ReturnType<Credentials>

function generateRandomStrings (byteLength = 32, amount = 1): string[] {
  const randoms: string[] = []
  for (let i = 0; i < amount; i++) {
    randoms.push(randomFillSync(Buffer.alloc(byteLength)).toString('base64'))
  }
  return randoms
}

class Config {
  protected defaults: {[key: string]: string | undefined }
  protected _ngrokUri?: string
  protected _host?: string

  constructor () {
    const defaultPort = '4000'

    this.defaults = {
      NODE_ENV: 'development',

      SERVER_PUBLIC_URI: 'http://localhost:4000',
      HOST_PORT: defaultPort,

      REVER_PROXY: '0',
      USE_NGROK: '0',
      USE_LOCALHOST_RUN: '0',

      VC_ISSUER: undefined,
      VC_DB_HOST: 'localhost',
      VC_DB_PORT: '27017',

      COOKIES_KEYS: generateRandomStrings(32, 3).join(','),
      JWKS_KEYS_PATH: './misc/jwks.json',
      IDENTITY_PATH: './misc/identity.json',
      CONTRACT_ABI: './misc/smart-contract-registry.json',

      RPC_URL: 'https://rinkeby.infura.io/ethr-did',
      WHITELIST: './misc/whitelist.js'
    }
  }

  // Conversion functions
  protected fromBoolean: ConvertFunction<boolean> = (v) => v.toLocaleLowerCase() === '1'
  protected fromArray: ConvertFunction<string[]> = (v) => v.split(',')
  protected fromInteger: ConvertFunction<number> = parseInt
  protected fromImport: <T>(v: string) => T = (v) => {
    // TODO: Only relative path supported
    const file = path.join(__dirname, '../', v)
    if (fs.existsSync(file)) {
      return require(file)
    } else {
      return undefined
    }
  }

  /**
   * Gets a configuration property comming from os environment or the
   * provided default configuration json file and casts the value.
   *
   * @param name Name of the property to get
   * @param convert Function to cast the value
   * @returns Return the property as string
   */
  get (name: string): string
  get<T>(name: string, convert: (value: string) => T): T
  get<T = string>(name: string, convert?: ConvertFunction<T>): T {
    const value = process.env[name] ?? this.defaults[name] ?? ''
    if (convert == null) {
      return value as unknown as T
    }

    return convert(value)
  }

  /**
   * @property Is production environment
   */
  get isProd (): boolean {
    return this.get('NODE_ENV', (v) => v === 'production')
  }

  /**
   * @property OpenID Connect Issuer
   */
  get issuer (): string {
    const issuer = this.get('OIDC_PROVIDER_ISSUER')
    return issuer || this.publicUri // eslint-disable-line
  }

  /**
   * @property Server hostname
   */
  get publicUri (): string {
    if (this.useNgrok) {
      return this.ngrokUri
    }
    return this.get('SERVER_PUBLIC_URI')
  }

  /**
    * @property Server port
    */
  get port (): number {
    return this.get('SERVER_PORT', this.fromInteger)
  }

  /**
   * @property Host port
   */
  get hostPort (): number {
    return this.get('HOST_PORT', this.fromInteger)
  }

  /**
   * @property Reverse proxy
   */
  get reverseProxy (): boolean {
    return this.get('REVERSE_PROXY', this.fromBoolean)
  }

  /**
   * @property Context path
   */
   get getContextPath (): string {
    return this.get('CONTEXT_PATH')
  }

  /**
   * @property Keys used by the OIDC to sign the cookies
   */
  get cookiesKeys (): string[] {
    return this.get('COOKIES_KEYS', this.fromArray)
  }

  /**
   * @property Path for the jwks keys used by the OIDC
   */
  get jwksKeysPath (): string {
    return this.get('JWKS_KEYS_PATH')
  }

  /**
   * @property It is used to create tunnels so the OIDC server uses a public https domain when testing.
   */
  get useNgrok (): boolean {
    return this.get('USE_NGROK', this.fromBoolean)
  }

  /**
   * @property Get identity promise. This identity contains a DID and its associated privateKey
   */
  get identityPath (): fs.PathLike {
    return this.get('IDENTITY_PATH')
  }

  /**
   * @property Get identity promise. This identity contains a DID and its associated privateKey
   */
  /*
   get smartcontractAbi (): fs.PathLike {
    return this.get('CONTRACT_ABI')
  }*/

  /**
   * @property Get identity promise. This identity contains a DID and its associated privateKey
   */
  get identityPromise (): Promise<Identity> {
    return readFilePromise(this.get('IDENTITY_PATH')).then((value) => {
      return JSON.parse(value.toString())
    })
  }

  /**
   * @property Get smart contract revocation registry promise. 
   */
   get smartcontractAbiPromise (): Promise<Identity> {
    return readFilePromise(this.get('CONTRACT_ABI')).then((value) => {
      return JSON.parse(value.toString())
    })
  }

  /**
   * @property Get smart contract registry for issuers promise. 
   */
   get issuerRegistryAbiPromise (): Promise<Identity> {
    return readFilePromise(this.get('ISSUER_REGISTRY_ABI')).then((value) => {
      return JSON.parse(value.toString())
    })
  }
  

  /**
   * @property Get the RPC URL
   */
  get rpcUrl (): string {
    return this.get('RPC_URL')
  }

  /**
   * @property A list of the trusted
   */
  get whitelist (): string[] {
    return this.get<string[]>('WHITELIST', this.fromImport)
  }

  /**
   * @property The endpoint of the smart contract registry for credentials revocation 
   */
   get smartContractRegistry (): string {
    return this.get('REGISTRY_CONTRACT');
  }

  /**
   * @property The endpoint of the smart contract registry for issuer
   */
  get smartContractIssuers (): string {
    return this.get('ISSUER_REGISTRY_CONTRACT');
  }

  /**
   * @property Ngrok uri
   */
  set ngrokUri (v: string) {
    this._ngrokUri = v
  }

  get ngrokUri (): string {
    if (this._ngrokUri === undefined) {
      throw new Error('Ngrok endpoint not initialized yet')
    }
    return this._ngrokUri
  }

  /**
   * @property Host
   */
  set host (v: string) {
    this._host = v
  }

  get host (): string {
    if (this._host === undefined) {
      throw new Error('Host not initialized yet')
    }
    return this._host
  }

  /**
   * @property Mongo connection URI
   */
   get mongoUri (): string {
    return [
      'mongodb://',
            `${this.get('VC_DB_USERNAME')}:${this.get('VC_DB_PASSWORD')}@`,
            `${this.get('VC_DB_HOST')}:${this.get('VC_DB_PORT')}/`,
            `${this.get('VC_DB_DATABASE')}?authSource=admin`
    ].join('')
  }
}

export default new Config()
