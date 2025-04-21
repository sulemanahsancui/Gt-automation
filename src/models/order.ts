import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToOne,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm'
import { Detail } from './detail'
import { Lead } from './lead'
import { User } from './user'
import { EnrollmentCenter } from './enrollmentCenter'
import { Note } from './note'

export enum OrderStatus {
  IN_PROGRESS = 0,
  COMPLETED = 1,
  REFUNDED = 2,
  CHARGEBACK = 3,
  REFUNDED_SENT_TO_COLLECTIONS = 4,
  REFUNDED_COLLECTED = 5,
  SUBMITTED = 6,
  READY_FOR_PAYMENT = 7,
  CUSTOMER_TOOK_OVER = 8,
  ISSUES = 9,
  UNRESPONSIVE = 10,
  INTERVIEW_SCHEDULED = 11,
  INTERVIEW_MISSED = 12,
}

export enum OrderType {
  GLOBAL_ENTRY_NEW_APPLICATION = 0,
  GLOBAL_ENTRY_RENEWAL = 1,
  GLOBAL_ENTRY_CHILD_NEW = 2,
  GLOBAL_ENTRY_CHILD_RENEWAL = 3,
  NEXUS_NEW_APPLICATION = 4,
  NEXUS_RENEWAL = 5,
  NEXUS_CHILD_NEW = 6,
  NEXUS_CHILD_RENEWAL = 7,
  SENTRI_NEW_APPLICATION = 8,
  SENTRI_RENEWAL = 9,
  SENTRI_CHILD_NEW = 10,
  SENTRI_CHILD_RENEWAL = 11,
}

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

  @ManyToOne(() => Payment)
  @JoinColumn({ name: 'payment_id' })
  payment: Payment

  @ManyToOne(() => Lead, (lead) => lead.orders, { nullable: true })
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

  @ManyToOne(() => Coupon)
  coupon: Coupon

  @ManyToOne(() => EnrollmentCenter)
  @JoinColumn({ name: 'enrollment_center_id' })
  enrollmentCenter: EnrollmentCenter

  @OneToMany(() => Note, (note) => note.order)
  notes: Note[]

  @OneToMany(() => Activity, (activity) => activity.order)
  activities: Activity[]

  @OneToMany(() => Order, (order) => order.relatedOrders)
  relatedOrders: Order[]
}
