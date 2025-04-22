import {
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

export class BaseModel {
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
