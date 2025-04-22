import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  JoinColumn,
  BeforeInsert,
  BaseEntity,
} from 'typeorm'
import { Detail } from './detail.entity'
import { Order } from './order'
import { randomUUID } from 'crypto'
import { HelperService } from 'src/services'

@Entity('leads')
export class Lead extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ nullable: true })
  name: string

  @Column({ name: 'phone_number', nullable: true })
  private rawPhoneNumber: string

  @Column({ nullable: true })
  email: string

  @Column({ nullable: true })
  pretty_id: string

  @Column({ nullable: true })
  type: number

  @Column({ nullable: true })
  source: string

  @Column({ nullable: true })
  source_url: string

  @Column({ nullable: true })
  coupon: string

  @ManyToOne(() => Detail, (detail) => detail.lead)
  @JoinColumn({ name: 'detail_id' })
  details: Detail

  @OneToOne(() => Order, (order) => order.lead)
  @JoinColumn({ name: 'email', referencedColumnName: 'email' })
  order: Order

  // Custom getter/setter for phone number
  set phoneNumber(value: string) {
    this.rawPhoneNumber = HelperService.removeNonNumeric(value)
  }

  get phoneNumber(): string {
    return HelperService.formatPhone(this.rawPhoneNumber)
  }

  @BeforeInsert()
  setPrettyId() {
    this.pretty_id = this.generatePrettyId()
  }

  private generatePrettyId(): string {
    // You might want to add a uniqueness check via DB later
    return randomUUID().replace(/-/g, '').substring(0, 12).toUpperCase()
  }

  serviceName(): string {
    switch (this.type) {
      case 0:
      case 1:
      case 2:
      case 3:
        return 'Global Entry'
      case 4:
      case 5:
      case 6:
      case 7:
        return 'NEXUS'
      case 8:
      case 9:
      case 10:
      case 11:
        return 'SENTRI'
      case 12:
      case 13:
      case 14:
      case 15:
        return 'TSA Pre-Check'
      default:
        return ''
    }
  }

  async addEventInKlaviyo() {
    // Add logic using KlaviyoService or an external module
    // This method would mimic what your Laravel app is doing.
  }

  async createContactInZendesk() {
    // Integrate Zendesk API logic here
  }

  async sendPostbackToKeitaro(session: Record<string, any>) {
    if (!session?.subid) return false

    const subid = session.subid
    const url = `https://happyfruitnow.com/d56d694/postback?status=Lead&subid=${subid}`

    try {
      const response = await fetch(url)
      return response.ok
    } catch (err) {
      console.error(err)
      return false
    }
  }
}
