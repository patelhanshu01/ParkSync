import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Reservation } from './reservation.entity';
import { EVCharger } from './ev-charger.entity';
import { ParkingSpot } from './parking-spot.entity';

@Entity()
export class ParkingLot {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column()
  location: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  pricePerHour: number;

  @Column({ default: true })
  isAvailable: boolean;

  @Column({ nullable: true })
  totalSpots: number;

  @Column({ default: 1 })
  floors: number;

  @Column({ nullable: true })
  availableSpots: number;

  // CO2 Impact Fields
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  co2_estimated_g: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  co2_savings_pct: number;

  @Column({ default: false })
  is_lowest_co2: boolean;

  // EV Charging
  @Column({ default: false })
  has_ev_charging: boolean;

  // Amenities
  @Column({ default: false })
  is_covered: boolean;

  @Column({ default: false })
  has_cctv: boolean;

  @Column({ default: false })
  is_free: boolean;

  @Column({ default: false })
  has_accessibility: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  height_limit_m: number;

  // Location Details
  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  longitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  distance_km: number;

  // Ratings
  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  rating: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  best_value_score: number;

  // Relations
  @OneToMany(() => Reservation, (reservation) => reservation.parkingLot)
  reservations: Reservation[];

  @OneToMany(() => EVCharger, (evCharger) => evCharger.parkingLot)
  ev_chargers: EVCharger[];

  @OneToMany(() => ParkingSpot, (spot) => spot.parkingLot)
  spots: ParkingSpot[];
}
