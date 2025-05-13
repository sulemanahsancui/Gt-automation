import dotenv from 'dotenv'

dotenv.config()

export default {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
  keyId: process.env.AWS_KMS_KEY_ID,
  customUserAgent: 'L5MOD/3.7.0',
}
