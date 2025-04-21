import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm'
import { Detail } from './detail'

@Entity({ name: 'vehicles' })
export class Vehicle {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ default: false })
  drive_across_mexico_border: boolean

  @Column({ default: false })
  vehicle_already_registered: boolean

  @Column({ nullable: true })
  vehicle_gov_license_plate: string

  @Column({ default: false })
  register_vehicle: boolean

  @Column({ nullable: true })
  vehicle_make: string

  @Column({ nullable: true })
  vehicle_model: string

  @Column({ nullable: true })
  vehicle_year: string

  @Column({ nullable: true })
  vehicle_color: string

  @Column({ nullable: true })
  vehicle_vin: string

  @Column({ nullable: true })
  vehicle_plate_number: string

  @Column({ nullable: true })
  vehicle_state: string

  @Column({ nullable: true })
  vehicle_country: string

  @Column({ nullable: true })
  vehicle_owner: string

  @Column({ nullable: true })
  vehicle_owner_name: string

  @Column({ nullable: true })
  vehicle_owner_first_name: string

  @Column({ nullable: true })
  vehicle_owner_middle_name: string

  @Column({ nullable: true })
  vehicle_owner_last_name: string

  @Column({ nullable: true })
  vehicle_owner_birth_day: string

  @Column({ nullable: true })
  vehicle_owner_birth_month: string

  @Column({ nullable: true })
  vehicle_owner_birth_year: string

  @Column({ nullable: true })
  vehicle_owner_dob: string

  @Column({ nullable: true })
  vehicle_owner_phone: string

  @Column({ nullable: true })
  vehicle_owner_gender: string

  @Column({ nullable: true })
  vehicle_owner_business_name: string

  @Column({ nullable: true })
  vehicle_owner_address: string

  @Column({ nullable: true })
  vehicle_owner_city: string

  @Column({ nullable: true })
  vehicle_owner_state: string

  @Column({ nullable: true })
  vehicle_owner_zip_code: string

  @Column({ nullable: true })
  vehicle_owner_business_phone: string

  @Column({ nullable: true })
  vehicle_owner_country: string

  // === RELATIONS ===

  @OneToOne(() => Detail, (detail) => detail.vehicle)
  @JoinColumn({ name: 'id', referencedColumnName: 'vehicle_id' }) // matches Laravel belongsTo('App\Models\Detail', 'id', 'vehicle_id')
  detail: Detail
}
