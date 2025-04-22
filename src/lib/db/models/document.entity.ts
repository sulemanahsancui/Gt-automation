import { config } from 'src/config'
import { Column, Entity, JoinColumn, OneToOne } from 'typeorm'
import { BaseTypeORMEntity } from './baseEntity'
import { DetailEntity } from './detail.entity'

@Entity('documents', { schema: config('DB_SCHEMA'), engine: 'InnoDB' })
export class DocumentEntity extends BaseTypeORMEntity {
  @Column({ type: 'varchar', nullable: true })
  country_citizenship: string | null

  @Column({ type: 'varchar', nullable: true })
  passport_number: string | null

  @Column({ type: 'varchar', nullable: true })
  passport_first_name: string | null

  @Column({ type: 'varchar', nullable: true })
  passport_middle_name: string | null

  @Column({ type: 'varchar', nullable: true })
  passport_last_name: string | null

  @Column({ type: 'date', nullable: true })
  passport_expiration_date: string | null

  @Column({ type: 'date', nullable: true })
  passport_issuance_date: string | null

  @Column({ type: 'varchar', nullable: true })
  previous_passport_number: string | null

  @Column({ type: 'varchar', nullable: true })
  pr_country: string | null

  @Column({ type: 'varchar', nullable: true })
  pr_card_number: string | null

  @Column({ type: 'varchar', nullable: true })
  pr_issuance_country: string | null

  @Column({ type: 'varchar', nullable: true })
  pr_full_name: string | null

  @Column({ type: 'varchar', nullable: true })
  pr_first_name: string | null

  @Column({ type: 'varchar', nullable: true })
  pr_middle_name: string | null

  @Column({ type: 'varchar', nullable: true })
  pr_last_name: string | null

  @Column({ type: 'varchar', nullable: true })
  pr_machine_readable: string | null

  @Column({ type: 'date', nullable: true })
  pr_expiration_date: string | null

  @Column({ type: 'varchar', nullable: true })
  dl_number: string | null

  @Column({ type: 'varchar', nullable: true })
  dl_first_name: string | null

  @Column({ type: 'varchar', nullable: true })
  dl_middle_name: string | null

  @Column({ type: 'varchar', nullable: true })
  dl_last_name: string | null

  @Column({ type: 'varchar', nullable: true })
  dl_country: string | null

  @Column({ type: 'varchar', nullable: true })
  dl_state: string | null

  @Column({ type: 'date', nullable: true })
  dl_issuance_date: string | null

  @Column({ type: 'date', nullable: true })
  dl_expiration_date: string | null

  @Column({ type: 'boolean', nullable: true, default: false })
  dl_edl: boolean | null

  @Column({ type: 'boolean', nullable: true, default: false })
  dl_cdl: boolean | null

  @Column({ type: 'boolean', nullable: true, default: false })
  dl_hazmat: boolean | null

  @Column({ type: 'varchar', nullable: true })
  rfc: string | null

  @Column({ type: 'boolean', nullable: true, default: false })
  rfc_owned_by_applicant: boolean | null

  @Column({ type: 'varchar', nullable: true })
  curp: string | null

  @Column({ type: 'varchar', nullable: true })
  maternal_name: string | null

  @OneToOne(() => DetailEntity, (detail: DetailEntity) => detail.document)
  @JoinColumn({ name: 'id', referencedColumnName: 'document_id' })
  detail: DetailEntity
}
