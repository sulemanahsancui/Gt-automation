import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm'
import { Detail } from './Detail'

@Entity('employment')
export class Employment {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ nullable: true }) employment_status_1: string
  @Column({ nullable: true }) employer_occupation_1: string
  @Column({ nullable: true }) employer_employer_1: string
  @Column({ nullable: true }) employer_street_1: string
  @Column({ nullable: true }) employer_city_1: string
  @Column({ nullable: true }) employer_state_1: string
  @Column({ nullable: true }) employer_zip_code_1: string
  @Column({ nullable: true }) employer_country_1: string
  @Column({ nullable: true }) employer_phone_number_1: string
  @Column({ nullable: true }) employer_from_date_1: string

  @Column({ nullable: true }) employment_status_2: string
  @Column({ nullable: true }) employer_occupation_2: string
  @Column({ nullable: true }) employer_employer_2: string
  @Column({ nullable: true }) employer_street_2: string
  @Column({ nullable: true }) employer_city_2: string
  @Column({ nullable: true }) employer_state_2: string
  @Column({ nullable: true }) employer_zip_code_2: string
  @Column({ nullable: true }) employer_country_2: string
  @Column({ nullable: true }) employer_phone_number_2: string
  @Column({ nullable: true }) employer_from_date_2: string

  @Column({ nullable: true }) employment_status_3: string
  @Column({ nullable: true }) employer_occupation_3: string
  @Column({ nullable: true }) employer_employer_3: string
  @Column({ nullable: true }) employer_street_3: string
  @Column({ nullable: true }) employer_city_3: string
  @Column({ nullable: true }) employer_state_3: string
  @Column({ nullable: true }) employer_zip_code_3: string
  @Column({ nullable: true }) employer_country_3: string
  @Column({ nullable: true }) employer_phone_number_3: string
  @Column({ nullable: true }) employer_from_date_3: string

  @Column({ nullable: true }) employment_status_4: string
  @Column({ nullable: true }) employer_occupation_4: string
  @Column({ nullable: true }) employer_employer_4: string
  @Column({ nullable: true }) employer_street_4: string
  @Column({ nullable: true }) employer_city_4: string
  @Column({ nullable: true }) employer_state_4: string
  @Column({ nullable: true }) employer_zip_code_4: string
  @Column({ nullable: true }) employer_country_4: string
  @Column({ nullable: true }) employer_phone_number_4: string
  @Column({ nullable: true }) employer_from_date_4: string

  @Column({ nullable: true }) employment_status_5: string
  @Column({ nullable: true }) employer_occupation_5: string
  @Column({ nullable: true }) employer_employer_5: string
  @Column({ nullable: true }) employer_street_5: string
  @Column({ nullable: true }) employer_city_5: string
  @Column({ nullable: true }) employer_state_5: string
  @Column({ nullable: true }) employer_zip_code_5: string
  @Column({ nullable: true }) employer_country_5: string
  @Column({ nullable: true }) employer_phone_number_5: string
  @Column({ nullable: true }) employer_from_date_5: string

  @OneToOne(() => Detail, (detail) => detail.employment)
  @JoinColumn({ name: 'id', referencedColumnName: 'employment_id' })
  detail: Detail
}
