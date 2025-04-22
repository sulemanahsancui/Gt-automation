import {
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  BaseEntity,
} from 'typeorm'

export class BaseTypeORMEntity extends BaseEntity {
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number

  @CreateDateColumn({
    type: 'timestamp',
    nullable: false,
  })
  created_at: Date | string

  @UpdateDateColumn({
    type: 'timestamp',
    nullable: false,
  })
  updated_at: Date | string
}
