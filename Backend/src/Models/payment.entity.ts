import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from './user.entity';
import { Reservation } from './reservation.entity';

@Entity()
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column()
  method: string; // 'card', 'cash', etc.

  @ManyToOne(() => User, (user) => user.payments)
  user: User;

  @ManyToOne(() => Reservation, (reservation) => reservation.payments)
  reservation: Reservation;
}
