import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm'

@Entity('bot_log')
export class BotLog {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ nullable: true })
  command: string

  @Column({ nullable: true })
  ipaddress: string

  @Column({ type: 'text', nullable: true })
  proxy_details: string

  @Column({ nullable: true })
  proxy_username: string

  @Column({ type: 'int', nullable: true })
  order_id: number

  @Column({ type: 'text', nullable: true })
  bot_message: string

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date
}
