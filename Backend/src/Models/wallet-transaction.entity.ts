import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Wallet } from './wallet.entity';

@Entity()
export class WalletTransaction {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount: number;

    @Column()
    type: string; // 'credit' or 'debit'

    @Column()
    description: string;

    @CreateDateColumn()
    date: Date;

    @Column({ nullable: true })
    reservation_id: number;

    @ManyToOne(() => Wallet, (wallet) => wallet.transactions)
    wallet: Wallet;
}
