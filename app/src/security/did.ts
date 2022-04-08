import { Credentials } from 'uport-credentials'
import { existsSync, PathLike, writeFile } from 'fs'
import config from '@i3-market/config'
import logger from '@i3-market/logger'

export const did = async (dstFilePath: PathLike = config.identityPath): Promise<void> => {
  return await new Promise((resolve, reject) => {
    const identity = Credentials.createIdentity()
    if (existsSync(dstFilePath)) {
      logger.info('Identity already generated')
      return resolve()
    }
    logger.info('Identity not present... generating a new one')
    writeFile(dstFilePath, JSON.stringify(identity), (err) => {      
      if (err) {
        console.log('Error generating a new identity: ' + err)
        return reject(err)
      } else {
        logger.info('Identity successfully generated')
        return resolve()
      }
    })
  })
}
