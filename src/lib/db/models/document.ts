import { config } from 'src/config'
import { Column, Entity, JoinColumn, OneToOne } from 'typeorm'
import { BaseModel } from './baseModel'
import { DetailEntity } from './detail.entity'

@Entity('documents', { schema: config('DB_SCHEMA'), engine: 'InnoDB' })
export class Document extends BaseModel {
  @Column({ nullable: true })
  country_citizenship: string

  @Column({ nullable: true })
  passport_number: string

  @Column({ nullable: true })
  passport_first_name: string

  @Column({ nullable: true })
  passport_middle_name: string

  @Column({ nullable: true })
  passport_last_name: string

  @Column({ nullable: true })
  passport_expiration_date: string

  @Column({ nullable: true })
  passport_issuance_date: string

  @Column({ nullable: true })
  previous_passport_number: string

  @Column({ nullable: true })
  pr_country: string

  @Column({ nullable: true })
  pr_card_number: string

  @Column({ nullable: true })
  pr_issuance_country: string

  @Column({ nullable: true })
  pr_full_name: string

  @Column({ nullable: true })
  pr_first_name: string

  @Column({ nullable: true })
  pr_middle_name: string

  @Column({ nullable: true })
  pr_last_name: string

  @Column({ nullable: true })
  pr_machine_readable: string

  @Column({ nullable: true })
  pr_expiration_date: string

  @Column({ nullable: true })
  dl_number: string

  @Column({ nullable: true })
  dl_first_name: string

  @Column({ nullable: true })
  dl_middle_name: string

  @Column({ nullable: true })
  dl_last_name: string

  @Column({ nullable: true })
  dl_country: string

  @Column({ nullable: true })
  dl_state: string

  @Column({ nullable: true })
  dl_issuance_date: string

  @Column({ nullable: true })
  dl_expiration_date: string

  @Column({ nullable: true })
  dl_edl: boolean

  @Column({ nullable: true })
  dl_cdl: boolean

  @Column({ nullable: true })
  dl_hazmat: boolean

  @Column({ nullable: true })
  rfc: string

  @Column({ nullable: true })
  rfc_owned_by_applicant: boolean

  @Column({ nullable: true })
  curp: string

  @Column({ nullable: true })
  maternal_name: string

  @OneToOne(() => DetailEntity, (detail: DetailEntity) => detail.document)
  @JoinColumn({ name: 'id', referencedColumnName: 'document_id' })
  detail: DetailEntity
}
