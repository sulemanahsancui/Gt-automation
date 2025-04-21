import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  JoinColumn,
} from 'typeorm'
import { Order } from './order'
import { Lead } from './lead'
import { Document } from './document'
import { Employment } from './employment'
import { Vehicle } from './vehicle'

@Entity('details')
export class Detail {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ nullable: true })
  first_name: string
  @Column({ nullable: true })
  middle_name: string
  @Column({ nullable: true })
  last_name: string
  @Column({ nullable: true })
  other_first_name: string
  @Column({ nullable: true })
  other_last_name: string
  @Column({ nullable: true })
  suffix: string
  @Column({ nullable: true })
  dob_year: number
  @Column({ nullable: true })
  dob_month: number
  @Column({ nullable: true })
  dob_day: number
  @Column({ nullable: true })
  country_birth: string
  @Column({ nullable: true })
  state_birth: string
  @Column({ nullable: true })
  city_birth: string
  @Column({ nullable: true })
  gender: string
  @Column({ nullable: true })
  eye_color: string
  @Column({ nullable: true })
  height_ft: number
  @Column({ nullable: true })
  height_in: number

  // Address Fields
  @Column({ nullable: true })
  address_street_1: string
  @Column({ nullable: true })
  address_city_1: string
  @Column({ nullable: true })
  address_zip_code_1: string
  @Column({ nullable: true })
  address_state_1: string
  @Column({ nullable: true })
  address_country_1: string
  @Column({ nullable: true })
  address_from_date_1: string

  @Column({ nullable: true })
  address_street_2: string
  @Column({ nullable: true })
  address_city_2: string
  @Column({ nullable: true })
  address_zip_code_2: string
  @Column({ nullable: true })
  address_state_2: string
  @Column({ nullable: true })
  address_country_2: string
  @Column({ nullable: true })
  address_from_date_2: string

  @Column({ nullable: true })
  address_street_3: string
  @Column({ nullable: true })
  address_city_3: string
  @Column({ nullable: true })
  address_zip_code_3: string
  @Column({ nullable: true })
  address_state_3: string
  @Column({ nullable: true })
  address_country_3: string
  @Column({ nullable: true })
  address_from_date_3: string

  @Column({ nullable: true })
  address_street_4: string
  @Column({ nullable: true })
  address_city_4: string
  @Column({ nullable: true })
  address_zip_code_4: string
  @Column({ nullable: true })
  address_state_4: string
  @Column({ nullable: true })
  address_country_4: string
  @Column({ nullable: true })
  address_from_date_4: string

  @Column({ nullable: true })
  address_street_5: string
  @Column({ nullable: true })
  address_city_5: string
  @Column({ nullable: true })
  address_zip_code_5: string
  @Column({ nullable: true })
  address_state_5: string
  @Column({ nullable: true })
  address_country_5: string
  @Column({ nullable: true })
  address_from_date_5: string

  // Mailing Address
  @Column({ nullable: true })
  mailing_street: string
  @Column({ nullable: true })
  mailing_city: string
  @Column({ nullable: true })
  mailing_zip_code: string
  @Column({ nullable: true })
  mailing_state: string
  @Column({ nullable: true })
  mailing_country: string
  @Column({ nullable: true })
  mailing_from_date: string

  // US Contact
  @Column({ nullable: true })
  us_contact_full_name: string
  @Column({ nullable: true })
  us_contact_street: string
  @Column({ nullable: true })
  us_contact_city: string
  @Column({ nullable: true })
  us_contact_state: string
  @Column({ nullable: true })
  us_contact_zip_code: string
  @Column({ nullable: true })
  us_contact_from_date: string
  @Column({ nullable: true })
  us_contact_phone_number: string

  @Column({ nullable: true })
  countries_visited: string
  @Column({ nullable: true })
  convicted_criminal: boolean
  @Column({ nullable: true })
  convicted_criminal_country: string
  @Column({ nullable: true })
  convicted_criminal_details: string
  @Column({ nullable: true })
  waiver_inadmissibility: boolean
  @Column({ nullable: true })
  waiver_inadmissibility_details: string
  @Column({ nullable: true })
  violation_customs_laws: boolean
  @Column({ nullable: true })
  violation_customs_laws_details: string
  @Column({ nullable: true })
  violation_immigration_laws: boolean
  @Column({ nullable: true })
  violation_immigration_laws_details: string

  @Column({ nullable: true })
  passid: string
  @Column({ nullable: true })
  membership_expiration_year: number
  @Column({ nullable: true })
  membership_expiration_month: number
  @Column({ nullable: true })
  membership_expiration_day: number

  @Column({ nullable: true })
  document_id: number
  @Column({ nullable: true })
  vehicle_id: number
  @Column({ nullable: true })
  employment_id: number

  // Guardian
  @Column({ nullable: true })
  guardian_last_name: string
  @Column({ nullable: true })
  guardian_first_name: string
  @Column({ nullable: true })
  guardian_middle_name: string
  @Column({ nullable: true })
  guardian_dob_year: number
  @Column({ nullable: true })
  guardian_dob_month: number
  @Column({ nullable: true })
  guardian_dob_day: number
  @Column({ nullable: true })
  guardian_gender: string
  @Column({ nullable: true })
  guardian_has_application: boolean

  @Column({ nullable: true })
  application_id: number
  @Column({ nullable: true })
  has_legal_issues: boolean
  @Column({ nullable: true })
  legal_issues_details: string
  @Column({ nullable: true })
  have_ktn_number: boolean
  @Column({ nullable: true })
  ktn_number: string

  // Relationships

  @ManyToOne(() => Order, (order) => order.detail)
  @JoinColumn({ name: 'id', referencedColumnName: 'detail_id' })
  order: Order

  @ManyToOne(() => Lead, (lead) => lead.details)
  @JoinColumn({ name: 'id', referencedColumnName: 'detail_id' })
  lead: Lead

  @OneToOne(() => Document)
  @JoinColumn({ name: 'document_id', referencedColumnName: 'id' })
  document: Document

  @OneToOne(() => Employment)
  @JoinColumn({ name: 'employment_id', referencedColumnName: 'id' })
  employment: Employment

  @OneToOne(() => Vehicle)
  @JoinColumn({ name: 'vehicle_id', referencedColumnName: 'id' })
  vehicle: Vehicle
}
