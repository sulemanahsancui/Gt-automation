import * as dotenv from 'dotenv'
import { config } from 'src/config'
import { DataSource } from 'typeorm'

dotenv.config()

export const myDataSource = new DataSource({
  type: 'mysql',
  host: config('DB_HOST') || 'localhost',
  port: parseInt(config('DB_PORT') || '3306', 10),
  username: config('DB_USERNAME') || 'root',
  password: config('DB_PASSWORD') || '',
  database: config('DB_NAME') || 'test',
  entities: [__dirname + '/../**/*.entity.{ts,js}'],
  migrations: [__dirname + '/../migrations/*.{ts,js}'],
  logging: config('TYPEORM_LOGGING') === 'true',
  synchronize: config('TYPEORM_SYNC') === 'true',
  timezone: 'Z',
  charset: 'utf8mb4_unicode_ci',
  // cache: {
  //   duration: 60000,
  // },
  poolSize: 10,
  extra: {
    connectionLimit: 10,
  },
})
