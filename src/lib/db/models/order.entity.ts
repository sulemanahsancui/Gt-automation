import { config } from 'src/config'
import { OrderStatus, OrderType } from 'src/lib/enums'
import {
  Column,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm'
import { BaseTypeORMEntity } from './baseEntity'
import { DetailEntity } from './detail.entity'
import { EnrollmentCenterEntity } from './enrollmentCenter.entity'
import { LeadEntity } from './lead.entity'
import { NoteEntity } from './note.entity'
import { UserEntity } from './user.entity'

@Entity('orders', { schema: config('DB_SCHEMA'), engine: 'InnoDB' })
export class OrderEntity extends BaseTypeORMEntity {
  @Column({ nullable: true })
  detail_id: number

  @Column({ nullable: true })
  payment_id: number

  @Column({ nullable: true })
  email: string

  @Column({ nullable: true })
  phone_number: string

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.IN_PROGRESS })
  status: OrderStatus

  @Column({ type: 'enum', enum: OrderType, nullable: true })
  type: OrderType

  @Column({ nullable: true })
  ready_for_payment_user_id: number

  @Column({ nullable: true })
  checked_user_id: number

  @Column({ nullable: true })
  coupon_id: number

  @Column({ nullable: true })
  enrollment_center_id: number

  @Column({ type: 'timestamp', nullable: true })
  refunded_at: Date

  @Column({ type: 'timestamp', nullable: true })
  chargebacked_at: Date

  @Column({ type: 'timestamp', nullable: true })
  completed_at: Date

  @Column({ type: 'timestamp', nullable: true })
  submitted_at: Date

  @Column({ type: 'timestamp', nullable: true })
  bot_started_at: Date

  @Column({ type: 'timestamp', nullable: true })
  bot_failed_at: Date

  @Column({ type: 'timestamp', nullable: true })
  bot_completed_at: Date

  @Column({ type: 'timestamp', nullable: true })
  walk_through_at: Date

  @Column({ type: 'timestamp', nullable: true })
  ready_for_payment_date: Date

  @Column({ type: 'timestamp', nullable: true })
  checked_out_at: Date

  @Column({ type: 'timestamp', nullable: true })
  checked_in_at: Date

  @Column({ type: 'timestamp', nullable: true })
  interview_at: Date

  @DeleteDateColumn()
  deleted_at: Date

  // RELATIONS
  @ManyToOne(() => DetailEntity)
  @JoinColumn({ name: 'detail_id' })
  detail: DetailEntity

  @ManyToOne(() => LeadEntity, (lead) => lead.order, { nullable: true })
  @JoinColumn({ name: 'email', referencedColumnName: 'email' })
  lead: LeadEntity

  @ManyToOne(() => UserEntity)
  user: UserEntity

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'ready_for_payment_user_id' })
  completedUser: UserEntity

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'checked_user_id' })
  checkedUser: UserEntity

  @ManyToOne(() => EnrollmentCenterEntity)
  @JoinColumn({ name: 'enrollment_center_id' })
  enrollmentCenter: EnrollmentCenterEntity

  @OneToMany(() => NoteEntity, (note) => note.order)
  notes: NoteEntity[]

  @OneToMany(() => OrderEntity, (order) => order.relatedOrders)
  relatedOrders: OrderEntity[]

  // @ManyToOne(() => Coupon)
  // coupon: Coupon

  // @OneToMany(() => Activity, (activity) => activity.order)
  // activities: Activity[]

  // @ManyToOne(() => Payment)
  // @JoinColumn({ name: 'payment_id' })
  // payment: Payment
}
