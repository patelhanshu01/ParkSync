import { Entity, PrimaryGeneratedColumn, Column, OneToMany, Index, BeforeInsert, BeforeUpdate } from 'typeorm';
import { Reservation } from './reservation.entity';
import { EVCharger } from './ev-charger.entity';
import { ParkingSpot } from './parking-spot.entity';

@Entity()
@Index('idx_parking_lot_lat_lng', ['latitude', 'longitude'])
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

  // Dynamic pricing / demand controls
  @Column({ default: false })
  dynamic_pricing_enabled: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 1 })
  surge_multiplier: number;

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

  @Index('idx_parking_lot_geo', { spatial: true })
  @Column({ type: 'geography', spatialFeatureType: 'Point', srid: 4326, nullable: true })
  geo_location: { type: 'Point'; coordinates: [number, number] } | null;

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

  @BeforeInsert()
  @BeforeUpdate()
  private syncGeoLocation() {
    const lat = this.latitude !== null && this.latitude !== undefined ? Number(this.latitude) : null;
    const lng = this.longitude !== null && this.longitude !== undefined ? Number(this.longitude) : null;
    if (lat !== null && lng !== null && Number.isFinite(lat) && Number.isFinite(lng)) {
      this.geo_location = { type: 'Point', coordinates: [lng, lat] };
      return;
    }
    this.geo_location = null;
  }
}
