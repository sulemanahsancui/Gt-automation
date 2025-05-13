// import KMS from 'aws-sdk/clients/kms';
import * as AWS from '@aws-sdk/client-kms'
import { default as awsConfig } from '../config/awsKms'

console.log({ awsConfig })
const kms = new AWS.KMS({
  credentials: {
    secretAccessKey: awsConfig.secretAccessKey,
    accessKeyId: awsConfig.accessKeyId,
  },
  region: awsConfig.region,
  customUserAgent: awsConfig.customUserAgent,
})

// Encrypt plain text
async function encrypt(source) {
  const params = {
    KeyId: awsConfig.keyId,
    Plaintext: Buffer.from(source, 'utf-8'),
  }
  try {
    const { CiphertextBlob } = await kms.encrypt(params)

    // Return encrypted data as base64 encoded string
    return Buffer.from(CiphertextBlob).toString('base64')
  } catch (err) {
    console.log('kms error:', err.message)
  }
}

// Decrypt (base64) encrypted text
async function decrypt(source) {
  const params = {
    KeyId: awsConfig.keyId,
    CiphertextBlob: Buffer.from(source, 'base64'),
  }

  try {
    const { Plaintext } = await kms.decrypt(params)
    return Buffer.from(Plaintext).toString()
  } catch (err) {
    console.log('kms error:', err.message)
  }
}

export { encrypt, decrypt }
