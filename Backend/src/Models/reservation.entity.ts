import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, OneToOne } from 'typeorm';
import { User } from './user.entity';
import { ParkingLot } from './parking-lot.entity';
import { Payment } from './payment.entity';
import { ParkingSpot } from './parking-spot.entity';

@Entity()
export class Reservation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  startTime: Date;

  @Column()
  endTime: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  co2_estimated_g: number;

  @ManyToOne(() => User, (user) => user.reservations)
  user: User;

  @ManyToOne(() => ParkingLot, (lot) => lot.reservations)
  parkingLot: ParkingLot;

  @OneToMany(() => Payment, (payment) => payment.reservation)
  payments: Payment[];

  // Linked Spot
  @ManyToOne(() => ParkingSpot, (spot) => spot.reservations, { nullable: true })
  spot: ParkingSpot;


}
