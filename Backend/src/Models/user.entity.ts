import { Entity, PrimaryGeneratedColumn, Column, OneToMany, OneToOne, Index } from 'typeorm';
import { Reservation } from './reservation.entity';
import { Payment } from './payment.entity';
import { Wallet } from './wallet.entity';
import { SavedCard } from './saved-card.entity';

@Entity()
@Index('idx_user_email', ['email'], { unique: true })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column()
  password: string;

  @Column({ default: 'user' })
  role: string;

  @Column({ nullable: true })
  hostBankName?: string;

  @Column({ nullable: true })
  hostAccountHolder?: string;

  @Column({ nullable: true })
  hostAccountNumber?: string;

  @Column({ nullable: true })
  hostRoutingNumber?: string;

  @Column({ nullable: true })
  hostPayoutEmail?: string;

  @Column({ nullable: true })
  hostStatus?: string;

  @Column({ type: 'timestamp', nullable: true })
  hostAppliedAt?: Date;

  @OneToMany(() => Reservation, (reservation) => reservation.user)
  reservations: Reservation[];

  @OneToMany(() => Payment, (payment) => payment.user)
  payments: Payment[];

  @OneToMany(() => SavedCard, (card) => card.user)
  savedCards: SavedCard[];

  @OneToOne(() => Wallet, (wallet) => wallet.user)
  wallet: Wallet;
}
