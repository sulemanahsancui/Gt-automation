import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { Order } from './order'
import { Note } from './note'

export enum Permission {
  ADMIN = 0,
  MANAGER = 1,
  REGULAR = 2,
}

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn()
  id: number

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

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date

  // === RELATIONS ===

  @OneToMany(() => Order, (order) => order.user)
  orders: Order[]

  @OneToMany(() => Order, (order) => order.completedUser)
  completedOrders: Order[]

  @OneToMany(() => Note, (note) => note.user)
  notes: Note[]

  // TODO: FIXME:
  // @OneToMany(() => Activity, (activity) => activity.user)
  // activities: Activity[]

  // @OneToMany(() => OrderAddon, (addon) => addon.user)
  // orderAddons: OrderAddon[]

  // @OneToOne(() => LoginSecurity, (loginSecurity) => loginSecurity.user)
  // @JoinColumn()
  // loginSecurity: LoginSecurity
}
