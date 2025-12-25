import { AppDataSource } from '../config/database.config';
import { Wallet } from '../Models/wallet.entity';
import { WalletTransaction } from '../Models/wallet-transaction.entity';
import { User } from '../Models/user.entity';

export class WalletService {
    private walletRepo = AppDataSource.getRepository(Wallet);
    private transactionRepo = AppDataSource.getRepository(WalletTransaction);
    private userRepo = AppDataSource.getRepository(User);

    async getWallet(userId: number) {
        let wallet = await this.walletRepo.findOne({
            where: { user: { id: userId } },
            relations: ['transactions']
        });

        // Create wallet if doesn't exist
        if (!wallet) {
            const user = await this.userRepo.findOne({ where: { id: userId } });
            if (!user) throw new Error('User not found');

            wallet = this.walletRepo.create({
                user,
                balance: 0,
                currency: 'USD',
                transactions: []
            });
            await this.walletRepo.save(wallet);
        }

        // Sort transactions by date
        wallet.transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return {
            balance: Number(wallet.balance),
            currency: wallet.currency,
            transactions: wallet.transactions.map(t => ({
                id: t.id,
                amount: Number(t.amount),
                type: t.type,
                description: t.description,
                date: t.date.toISOString(),
                reservation_id: t.reservation_id
            }))
        };
    }

    async addCredit(userId: number, amount: number, description: string, reservationId?: number) {
        let wallet = await this.walletRepo.findOne({
            where: { user: { id: userId } }
        });

        if (!wallet) {
            const user = await this.userRepo.findOne({ where: { id: userId } });
            if (!user) throw new Error('User not found');

            wallet = this.walletRepo.create({ user, balance: 0, currency: 'USD' });
            await this.walletRepo.save(wallet);
        }

        // Update balance
        wallet.balance = Number(wallet.balance) + amount;
        await this.walletRepo.save(wallet);

        // Create transaction record
        const transaction = this.transactionRepo.create({
            wallet,
            amount,
            type: 'credit',
            description,
            reservation_id: reservationId
        });
        await this.transactionRepo.save(transaction);

        return {
            success: true,
            new_balance: Number(wallet.balance)
        };
    }

    async deductCredit(userId: number, amount: number, description: string, reservationId?: number) {
        const wallet = await this.walletRepo.findOne({
            where: { user: { id: userId } }
        });

        if (!wallet) {
            throw new Error('Wallet not found');
        }

        if (Number(wallet.balance) < amount) {
            throw new Error('Insufficient wallet balance');
        }

        // Update balance
        wallet.balance = Number(wallet.balance) - amount;
        await this.walletRepo.save(wallet);

        // Create transaction record
        const transaction = this.transactionRepo.create({
            wallet,
            amount,
            type: 'debit',
            description,
            reservation_id: reservationId
        });
        await this.transactionRepo.save(transaction);

        return {
            success: true,
            new_balance: Number(wallet.balance)
        };
    }

    async applyToBooking(userId: number, reservationId: number, amount: number) {
        return await this.deductCredit(
            userId,
            amount,
            `Applied to reservation #${reservationId}`,
            reservationId
        );
    }
}
