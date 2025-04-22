import { config } from 'src/config'
import { Column, Entity, OneToMany } from 'typeorm'
import { BaseTypeORMEntity } from './baseEntity'
import { NoteEntity } from './note.entity'
import { OrderEntity } from './order.entity'

export enum Permission {
  ADMIN = 0,
  MANAGER = 1,
  REGULAR = 2,
}

@Entity('users', { schema: config('DB_SCHEMA'), engine: 'InnoDB' })
export class UserEntity extends BaseTypeORMEntity {
  @Column()
  name: string

  @Column({ unique: true })
  email: string

  @Column()
  password: string

  @Column({ nullable: true })
  remember_token: string

  @Column({ type: 'enum', enum: Permission, default: Permission.REGULAR })
  permission_id: Permission

  @Column({ type: 'int', nullable: true })
  view_limit: number

  @Column({ type: 'timestamp', nullable: true })
  email_verified_at: Date

  @Column({ type: 'timestamp', nullable: true })
  ip_updated_at: Date

  // === RELATIONS ===

  @OneToMany(() => OrderEntity, (order) => order.user)
  orders: OrderEntity[]

  @OneToMany(() => OrderEntity, (order) => order.completedUser)
  completedOrders: OrderEntity[]

  @OneToMany(() => NoteEntity, (note) => note.user)
  notes: NoteEntity[]

  // TODO: FIXME:
  // @OneToMany(() => Activity, (activity) => activity.user)
  // activities: Activity[]

  // @OneToMany(() => OrderAddon, (addon) => addon.user)
  // orderAddons: OrderAddon[]

  // @OneToOne(() => LoginSecurity, (loginSecurity) => loginSecurity.user)
  // @JoinColumn()
  // loginSecurity: LoginSecurity
}
