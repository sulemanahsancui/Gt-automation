import { OrderStatus, OrderType } from 'src/lib/enums'
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { Detail } from './detail.entity'
import { EnrollmentCenter } from './enrollmentCenter'
import { Lead } from './lead'
import { Note } from './note'
import { User } from './user'

@Entity({ name: 'orders' })
export class Order {
  @PrimaryGeneratedColumn()
  id: number

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

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date

  @DeleteDateColumn()
  deleted_at: Date

  // RELATIONS
  @ManyToOne(() => Detail)
  @JoinColumn({ name: 'detail_id' })
  detail: Detail

  @ManyToOne(() => Lead, (lead) => lead.order, { nullable: true })
  @JoinColumn({ name: 'email', referencedColumnName: 'email' })
  lead: Lead

  @ManyToOne(() => User)
  user: User

  @ManyToOne(() => User)
  @JoinColumn({ name: 'ready_for_payment_user_id' })
  completedUser: User

  @ManyToOne(() => User)
  @JoinColumn({ name: 'checked_user_id' })
  checkedUser: User

  @ManyToOne(() => EnrollmentCenter)
  @JoinColumn({ name: 'enrollment_center_id' })
  enrollmentCenter: EnrollmentCenter

  @OneToMany(() => Note, (note) => note.order)
  notes: Note[]

  @OneToMany(() => Order, (order) => order.relatedOrders)
  relatedOrders: Order[]

  // @ManyToOne(() => Coupon)
  // coupon: Coupon

  // @OneToMany(() => Activity, (activity) => activity.order)
  // activities: Activity[]

  // @ManyToOne(() => Payment)
  // @JoinColumn({ name: 'payment_id' })
  // payment: Payment
}
