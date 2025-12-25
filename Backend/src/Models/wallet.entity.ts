import { Entity, PrimaryGeneratedColumn, Column, OneToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { WalletTransaction } from './wallet-transaction.entity';

@Entity()
export class Wallet {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    balance: number;

    @Column({ default: 'USD' })
    currency: string;

    @OneToOne(() => User, (user) => user.wallet)
    @JoinColumn()
    user: User;

    @OneToMany(() => WalletTransaction, (transaction) => transaction.wallet)
    transactions: WalletTransaction[];
}
