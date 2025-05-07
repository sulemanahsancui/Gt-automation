import { config } from '../../../config'
import { Column, Entity, JoinColumn, OneToOne } from 'typeorm'
import { BaseTypeORMEntity } from './baseEntity'
import { DetailEntity } from './detail.entity'

@Entity('employment', { schema: config('DB_SCHEMA'), engine: 'InnoDB' })
export class EmploymentEntity extends BaseTypeORMEntity {
  @Column({ type: 'varchar', nullable: true })
  employment_status_1: string | null

  @Column({ type: 'varchar', nullable: true })
  employer_occupation_1: string | null

  @Column({ type: 'varchar', nullable: true })
  employer_employer_1: string | null

  @Column({ type: 'varchar', nullable: true })
  employer_street_1: string | null

  @Column({ type: 'varchar', nullable: true })
  employer_city_1: string | null

  @Column({ type: 'varchar', nullable: true })
  employer_state_1: string | null

  @Column({ type: 'varchar', nullable: true })
  employer_zip_code_1: string | null

  @Column({ type: 'varchar', nullable: true })
  employer_country_1: string | null

  @Column({ type: 'varchar', nullable: true })
  employer_phone_number_1: string | null

  @Column({ type: 'date', nullable: true })
  employer_from_date_1: string | null

  @Column({ type: 'varchar', nullable: true })
  employment_status_2: string | null

  @Column({ type: 'varchar', nullable: true })
  employer_occupation_2: string | null

  @Column({ type: 'varchar', nullable: true })
  employer_employer_2: string | null

  @Column({ type: 'varchar', nullable: true })
  employer_street_2: string | null

  @Column({ type: 'varchar', nullable: true })
  employer_city_2: string | null

  @Column({ type: 'varchar', nullable: true })
  employer_state_2: string | null

  @Column({ type: 'varchar', nullable: true })
  employer_zip_code_2: string | null

  @Column({ type: 'varchar', nullable: true })
  employer_country_2: string | null

  @Column({ type: 'varchar', nullable: true })
  employer_phone_number_2: string | null

  @Column({ type: 'date', nullable: true })
  employer_from_date_2: string | null

  @Column({ type: 'varchar', nullable: true })
  employment_status_3: string | null

  @Column({ type: 'varchar', nullable: true })
  employer_occupation_3: string | null

  @Column({ type: 'varchar', nullable: true })
  employer_employer_3: string | null

  @Column({ type: 'varchar', nullable: true })
  employer_street_3: string | null

  @Column({ type: 'varchar', nullable: true })
  employer_city_3: string | null

  @Column({ type: 'varchar', nullable: true })
  employer_state_3: string | null

  @Column({ type: 'varchar', nullable: true })
  employer_zip_code_3: string | null

  @Column({ type: 'varchar', nullable: true })
  employer_country_3: string | null

  @Column({ type: 'varchar', nullable: true })
  employer_phone_number_3: string | null

  @Column({ type: 'date', nullable: true })
  employer_from_date_3: string | null

  @Column({ type: 'varchar', nullable: true })
  employment_status_4: string | null

  @Column({ type: 'varchar', nullable: true })
  employer_occupation_4: string | null

  @Column({ type: 'varchar', nullable: true })
  employer_employer_4: string | null

  @Column({ type: 'varchar', nullable: true })
  employer_street_4: string | null

  @Column({ type: 'varchar', nullable: true })
  employer_city_4: string | null

  @Column({ type: 'varchar', nullable: true })
  employer_state_4: string | null

  @Column({ type: 'varchar', nullable: true })
  employer_zip_code_4: string | null

  @Column({ type: 'varchar', nullable: true })
  employer_country_4: string | null

  @Column({ type: 'varchar', nullable: true })
  employer_phone_number_4: string | null

  @Column({ type: 'date', nullable: true })
  employer_from_date_4: string | null

  @Column({ type: 'varchar', nullable: true })
  employment_status_5: string | null

  @Column({ type: 'varchar', nullable: true })
  employer_occupation_5: string | null

  @Column({ type: 'varchar', nullable: true })
  employer_employer_5: string | null

  @Column({ type: 'varchar', nullable: true })
  employer_street_5: string | null

  @Column({ type: 'varchar', nullable: true })
  employer_city_5: string | null

  @Column({ type: 'varchar', nullable: true })
  employer_state_5: string | null

  @Column({ type: 'varchar', nullable: true })
  employer_zip_code_5: string | null

  @Column({ type: 'varchar', nullable: true })
  employer_country_5: string | null

  @Column({ type: 'varchar', nullable: true })
  employer_phone_number_5: string | null

  @Column({ type: 'date', nullable: true })
  employer_from_date_5: string | null

  @OneToOne(() => DetailEntity, (detail) => detail.employment)
  @JoinColumn({ name: 'id', referencedColumnName: 'employment_id' })
  detail: DetailEntity
}
