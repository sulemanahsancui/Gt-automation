import { config } from 'src/config'
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm'
import { BaseTypeORMEntity } from './baseEntity'
import { OrderEntity } from './order.entity'
import { UserEntity } from './user.entity'

@Entity('notes', { schema: config('DB_SCHEMA'), engine: 'InnoDB' })
export class NoteEntity extends BaseTypeORMEntity {
  @Column({ nullable: true })
  content: string

  @Column({ name: 'order_id' })
  orderId: number

  @Column({ name: 'user_id' })
  userId: number

  @ManyToOne(() => OrderEntity, (order) => order.notes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: OrderEntity

  @ManyToOne(() => UserEntity, (user) => user.notes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity
}
