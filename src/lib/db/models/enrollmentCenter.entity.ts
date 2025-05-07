import { config } from '../../../config'
import { Column, Entity, OneToMany } from 'typeorm'
import { BaseTypeORMEntity } from './baseEntity'
import { OrderEntity } from './order.entity'

@Entity('enrollment_centers', { schema: config('DB_SCHEMA'), engine: 'InnoDB' })
export class EnrollmentCenterEntity extends BaseTypeORMEntity {
  @Column({ type: 'varchar', nullable: true })
  name: string | null

  @Column('double precision', { nullable: true })
  latitude: number | null

  @Column('double precision', { nullable: true })
  longitude: number | null

  @Column({ type: 'varchar', nullable: true })
  service: 'ge' | 'nx' | 'sr' | null

  @Column({ type: 'boolean', default: true })
  active: boolean

  @OneToMany(() => OrderEntity, (order) => order.enrollmentCenter)
  orders: OrderEntity[]

  static async getClosestEnrollmentCenters(
    order: OrderEntity,
  ): Promise<EnrollmentCenterEntity[] | false> {
    const coordinates = await order.detail?.getCoordinates?.()

    if (!coordinates) return false

    const serviceMap: Record<string, 'ge' | 'nx' | 'sr'> = {
      'Global Entry': 'ge',
      NEXUS: 'nx',
      SENTRI: 'sr',
    }

    const presenter = (order as any).presenter?.()
    const serviceName: 'ge' | 'nx' | 'sr' =
      serviceMap[presenter?.serviceName] ?? 'ge'

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
      .getRawMany()
  }
}
