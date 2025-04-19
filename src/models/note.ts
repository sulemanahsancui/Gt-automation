import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
  } from 'typeorm';
  import { Order } from './order';
  import { User } from './user';
  
  @Entity('notes')
  export class Note {
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column({ nullable: true })
    content: string; // Add actual columns like content if they exist in your DB
  
    @Column({ name: 'order_id' })
    orderId: number;
  
    @Column({ name: 'user_id' })
    userId: number;
  
    @ManyToOne(() => Order, (order) => order.notes, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'order_id' })
    order: Order;
  
    @ManyToOne(() => User, (user) => user.notes, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;
  }
  