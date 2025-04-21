import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  BaseEntity,
} from 'typeorm'
import { Order } from './Order'

@Entity('enrollment_centers')
export class EnrollmentCenter extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ nullable: true }) name: string

  @Column('double precision', { nullable: true })
  latitude: number

  @Column('double precision', { nullable: true })
  longitude: number

  @Column({ nullable: true })
  service: string // 'ge', 'nx', 'sr'

  @Column({ default: true })
  active: boolean

  @OneToMany(() => Order, (order) => order.enrollmentCenter)
  orders: Order[]

  static async getClosestEnrollmentCenters(
    order: Order,
  ): Promise<EnrollmentCenter[] | false> {
    const coordinates = order.detail?.getCoordinates?.()

    if (!coordinates) return false

    const serviceNames: Record<string, string> = {
      'Global Entry': 'ge',
      NEXUS: 'nx',
      SENTRI: 'sr',
    }
    const serviceName = serviceNames[order.presenter().serviceName] ?? 'ge'

    const entityManager = this.getRepository()
    return await entityManager
      .createQueryBuilder('ec')
      .select([
        'ec.*',
        `ST_Distance_Sphere(
            POINT(:lng, :lat),
            POINT(ec.longitude, ec.latitude)
          ) AS dist`,
      ])
      .where('ec.service = :service', { service: serviceName })
      .andWhere('ec.active = true')
      .setParameters({ lng: coordinates.longitude, lat: coordinates.latitude })
      .orderBy('dist')
      .limit(3)
      .getRawMany() // Returns raw rows with "dist"
  }
}
