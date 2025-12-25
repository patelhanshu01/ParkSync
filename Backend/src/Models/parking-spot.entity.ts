import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { ParkingLot } from './parking-lot.entity';
import { Reservation } from './reservation.entity';

@Entity()
export class ParkingSpot {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    spot_number: string;

    @Column()
    status: string; // 'available', 'occupied', 'reserved', 'ev_charging', 'accessibility'

    @Column()
    type: string; // 'regular', 'ev', 'accessibility', 'compact'

    @Column({ nullable: true })
    floor_level: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    position_x: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    position_y: number;

    @ManyToOne(() => ParkingLot, (parkingLot) => parkingLot.spots)
    parkingLot: ParkingLot;

    @OneToMany(() => Reservation, (reservation) => reservation.spot)
    reservations: Reservation[];

    // Optional runtime-only field to show the next upcoming reservation attached by services
    // Not persisted in DB
    nextReservation?: { id: number; startTime: Date; endTime: Date; user?: any } | null;
}

