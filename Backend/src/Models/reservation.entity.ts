import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, OneToOne, Index } from 'typeorm';
import { User } from './user.entity';
import { ParkingLot } from './parking-lot.entity';
import { Payment } from './payment.entity';
import { ParkingSpot } from './parking-spot.entity';
import { Listing } from './listing.entity';

@Entity()
@Index('idx_reservation_parking_lot', ['parkingLot'])
export class Reservation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  startTime: Date;

  @Column()
  endTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  reservedEndTime: Date;

  @Column({ default: false })
  autoExtendEnabled: boolean;

  @Column({ type: 'int', default: 15 })
  autoExtendIntervalMinutes: number;

  @Column({ type: 'int', default: 120 })
  autoExtendCapMinutes: number;

  @Column({ type: 'timestamp', nullable: true })
  reminderSentAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  endedAt: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  co2_estimated_g: number;

  @Column({ nullable: true })
  contactName: string;

  @Column({ nullable: true })
  contactEmail: string;

  @ManyToOne(() => User, (user) => user.reservations)
  user: User;

  @ManyToOne(() => ParkingLot, (lot) => lot.reservations)
  parkingLot: ParkingLot;

  // Optional: reservations for private listings (driveway bookings)
  @ManyToOne(() => Listing, { nullable: true })
  listing?: Listing;

  @OneToMany(() => Payment, (payment) => payment.reservation)
  payments: Payment[];

  // Linked Spot
  @ManyToOne(() => ParkingSpot, (spot) => spot.reservations, { nullable: true })
  spot: ParkingSpot;


}
