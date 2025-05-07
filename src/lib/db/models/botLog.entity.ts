import { Column, Entity } from 'typeorm'
import { config } from '../../../config'
import { BaseTypeORMEntity } from './baseEntity'

@Entity('bot_log', { schema: config('DB_SCHEMA'), engine: 'InnoDB' })
export class BotLogEntity extends BaseTypeORMEntity {
  @Column({ nullable: true, type: 'varchar' })
  command: string

  @Column({ nullable: true, type: 'varchar' })
  ipaddress: string

  @Column({ nullable: true, type: 'varchar' })
  proxy_details: string

  @Column({ nullable: true, type: 'varchar' })
  proxy_username: string

  @Column({ type: 'int', nullable: true, unsigned: true })
  order_id: number

  @Column({ type: 'varchar', nullable: true })
  bot_message: string
}
