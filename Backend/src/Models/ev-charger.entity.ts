import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { ParkingLot } from './parking-lot.entity';

@Entity()
export class EVCharger {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    connector_type: string; // 'CCS2', 'Type2', 'NACS', 'CHAdeMO', 'J1772'

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    power_kw: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    cost_per_kwh: number;

    @Column({ default: true })
    availability: boolean;

    @Column({ nullable: true })
    charger_id: string;

    @ManyToOne(() => ParkingLot, (parkingLot) => parkingLot.ev_chargers)
    parkingLot: ParkingLot;
}
