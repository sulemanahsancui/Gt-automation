import axios from 'axios'
import { Max, Min } from 'class-validator'
import moment from 'moment'
import { config } from 'src/config'
import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm'
import { BaseTypeORMEntity } from './baseEntity'
import { EmploymentEntity } from './employment.entity'
import { LeadEntity } from './lead.entity'
import { OrderEntity } from './order.entity'
import { Vehicle } from './vehicle.entity'

@Entity('details', { schema: config('DB_SCHEMA'), engine: 'InnoDB' })
export class DetailEntity extends BaseTypeORMEntity {
  @Column({ nullable: true, type: 'varchar', length: 25 })
  first_name: string

  @Column({ nullable: true, type: 'varchar', length: 25 })
  middle_name: string

  @Column({ nullable: true, type: 'varchar', length: 25 })
  last_name: string

  @Column({ nullable: true, type: 'varchar', length: 25 })
  other_first_name: string

  @Column({ nullable: true, type: 'varchar', length: 25 })
  other_last_name: string

  @Column({ nullable: true, type: 'varchar', length: 25 })
  suffix: string

  @Column({ nullable: true, unsigned: true, type: 'number' })
  @Max(moment().get('year'))
  @Min(1950)
  dob_year: number

  @Column({ nullable: true, type: 'number' })
  @Max(12)
  @Min(1)
  dob_month: number

  @Column({ nullable: true, type: 'number' })
  @Max(31)
  @Min(1)
  dob_day: number

  @Column({ nullable: true, type: 'varchar', length: '50' })
  country_birth: string

  @Column({ nullable: true, type: 'varchar', length: '25' })
  state_birth: string

  @Column({ nullable: true, type: 'varchar', length: '25' })
  city_birth: string

  @Column({ nullable: true, type: 'varchar', length: '10' })
  gender: string

  @Column({ nullable: true, type: 'varchar', length: '25' })
  eye_color: string

  @Column({ nullable: true, type: 'number' })
  height_ft: number

  @Column({ nullable: true, type: 'number' })
  height_in: number

  // Address Fields
  @Column({ nullable: true, type: 'varchar' })
  address_street_1: string

  @Column({ nullable: true, type: 'varchar' })
  address_city_1: string

  @Column({ nullable: true, type: 'varchar' })
  address_zip_code_1: string

  @Column({ nullable: true, type: 'varchar' })
  address_state_1: string

  @Column({ nullable: true, type: 'varchar' })
  address_country_1: string

  @Column({ nullable: true, type: 'varchar' })
  address_from_date_1: string

  @Column({ nullable: true, type: 'varchar' })
  address_street_2: string

  @Column({ nullable: true, type: 'varchar' })
  address_city_2: string

  @Column({ nullable: true, type: 'varchar' })
  address_zip_code_2: string

  @Column({ nullable: true, type: 'varchar' })
  address_state_2: string

  @Column({ nullable: true, type: 'varchar' })
  address_country_2: string

  @Column({ nullable: true, type: 'varchar' })
  address_from_date_2: string

  @Column({ nullable: true, type: 'varchar' })
  address_street_3: string

  @Column({ nullable: true, type: 'varchar' })
  address_city_3: string

  @Column({ nullable: true, type: 'varchar' })
  address_zip_code_3: string

  @Column({ nullable: true, type: 'varchar' })
  address_state_3: string

  @Column({ nullable: true, type: 'varchar' })
  address_country_3: string

  @Column({ nullable: true, type: 'varchar' })
  address_from_date_3: string

  @Column({ nullable: true, type: 'varchar' })
  address_street_4: string

  @Column({ nullable: true, type: 'varchar' })
  address_city_4: string

  @Column({ nullable: true, type: 'varchar' })
  address_zip_code_4: string

  @Column({ nullable: true, type: 'varchar' })
  address_state_4: string

  @Column({ nullable: true, type: 'varchar' })
  address_country_4: string

  @Column({ nullable: true, type: 'varchar' })
  address_from_date_4: string

  @Column({ nullable: true, type: 'varchar' })
  address_street_5: string

  @Column({ nullable: true, type: 'varchar' })
  address_city_5: string

  @Column({ nullable: true, type: 'varchar' })
  address_zip_code_5: string

  @Column({ nullable: true, type: 'varchar' })
  address_state_5: string

  @Column({ nullable: true, type: 'varchar' })
  address_country_5: string

  @Column({ nullable: true, type: 'varchar' })
  address_from_date_5: string

  // Mailing Address
  @Column({ nullable: true, type: 'varchar' })
  mailing_street: string

  @Column({ nullable: true, type: 'varchar' })
  mailing_city: string

  @Column({ nullable: true, type: 'varchar' })
  mailing_zip_code: string

  @Column({ nullable: true, type: 'varchar' })
  mailing_state: string

  @Column({ nullable: true, type: 'varchar' })
  mailing_country: string

  @Column({ nullable: true, type: 'varchar' })
  mailing_from_date: string

  // US Contact
  @Column({ nullable: true, type: 'varchar' })
  us_contact_full_name: string

  @Column({ nullable: true, type: 'varchar' })
  us_contact_street: string

  @Column({ nullable: true, type: 'varchar' })
  us_contact_city: string

  @Column({ nullable: true, type: 'varchar' })
  us_contact_state: string

  @Column({ nullable: true, type: 'varchar' })
  us_contact_zip_code: string

  @Column({ nullable: true, type: 'varchar' })
  us_contact_from_date: string

  @Column({ nullable: true, type: 'varchar' })
  us_contact_phone_number: string

  @Column({ nullable: true, type: 'varchar' })
  countries_visited: string

  @Column({ nullable: true, type: 'boolean' })
  convicted_criminal: boolean

  @Column({ nullable: true, type: 'varchar' })
  convicted_criminal_country: string

  @Column({ nullable: true, type: 'varchar' })
  convicted_criminal_details: string

  @Column({ nullable: true, type: 'boolean' })
  waiver_inadmissibility: boolean

  @Column({ nullable: true, type: 'varchar' })
  waiver_inadmissibility_details: string

  @Column({ nullable: true, type: 'boolean' })
  violation_customs_laws: boolean

  @Column({ nullable: true, type: 'varchar' })
  violation_customs_laws_details: string

  @Column({ nullable: true, type: 'boolean' })
  violation_immigration_laws: boolean

  @Column({ nullable: true, type: 'varchar' })
  violation_immigration_laws_details: string

  @Column({ nullable: true, type: 'varchar' })
  passid: string

  @Column({ nullable: true, type: 'number', unsigned: true })
  membership_expiration_year: number

  @Column({ nullable: true, type: 'number', unsigned: true })
  membership_expiration_month: number

  @Column({ nullable: true, type: 'number', unsigned: true })
  membership_expiration_day: number

  @Column({ nullable: true, type: 'number', unsigned: true })
  document_id: number

  @Column({ nullable: true, type: 'number', unsigned: true })
  vehicle_id: number

  @Column({ nullable: true, type: 'number', unsigned: true })
  employment_id: number

  // Guardian
  @Column({ nullable: true, type: 'varchar', length: 25 })
  guardian_last_name: string

  @Column({ nullable: true, type: 'varchar', length: 25 })
  guardian_first_name: string

  @Column({ nullable: true, type: 'varchar', length: 25 })
  guardian_middle_name: string

  @Column({ nullable: true })
  @Max(moment().get('year'))
  @Min(1950)
  guardian_dob_year: number

  @Column({ nullable: true })
  @Max(12)
  @Min(1)
  guardian_dob_month: number

  @Column({ nullable: true })
  @Max(31)
  @Min(1)
  guardian_dob_day: number

  @Column({ nullable: true, type: 'varchar', length: '10' })
  guardian_gender: string

  @Column({ nullable: true, type: 'varchar' })
  guardian_has_application: boolean

  @Column({ nullable: true, unsigned: true, type: 'number' })
  application_id: number

  @Column({ nullable: true, type: 'boolean' })
  has_legal_issues: boolean

  @Column({ nullable: true, type: 'varchar' })
  legal_issues_details: string

  @Column({ nullable: true, type: 'boolean' })
  have_ktn_number: boolean

  @Column({ nullable: true, type: 'varchar' })
  ktn_number: string

  // Relationships

  @ManyToOne(() => OrderEntity, (order) => order.detail)
  @JoinColumn({ name: 'id', referencedColumnName: 'detail_id' })
  order: OrderEntity

  @ManyToOne(() => LeadEntity, (lead) => lead.details)
  @JoinColumn({ name: 'id', referencedColumnName: 'detail_id' })
  lead: LeadEntity

  @OneToOne(() => Document)
  @JoinColumn({ name: 'document_id', referencedColumnName: 'id' })
  document: Document

  @OneToOne(() => EmploymentEntity)
  @JoinColumn({ name: 'employment_id', referencedColumnName: 'id' })
  employment: EmploymentEntity

  @OneToOne(() => Vehicle)
  @JoinColumn({ name: 'vehicle_id', referencedColumnName: 'id' })
  vehicle: Vehicle

  async getCoordinates() {
    const query = `${this.address_street_1}, ${this.address_city_1}, ${this.address_state_1}, ${this.address_zip_code_1}, ${this.address_country_1}`
    const uRLSearchParams = new URLSearchParams()
    uRLSearchParams.append('query', query)
    const url = `https://api.radar.io/v1/geocode/forward?${uRLSearchParams.toString()}`

    const headers = {
      Authorization: config('RADAR_PUBLIC'),
    }
    const { data: response } = await axios.get(url, { headers })
    if (response.addresses[0]) {
      return {
        latitude: response.addresses[0].latitude,
        longitude: response.addresses[0].longitude,
      }
    }

    return false
  }
}
