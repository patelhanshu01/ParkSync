import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { ParkingLot } from './parking-lot.entity';
import { User } from './user.entity';

@Entity()
export class WaitlistEntry {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ParkingLot, (lot) => lot.id, { nullable: false })
  parkingLot: ParkingLot;

  @ManyToOne(() => User, (user) => user.id, { nullable: true })
  user: User | null;

  @Column({ nullable: true })
  contact_email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ default: 'pending' })
  status: 'pending' | 'notified' | 'expired';

  @CreateDateColumn()
  createdAt: Date;
}
