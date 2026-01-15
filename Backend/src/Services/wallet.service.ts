import { AppDataSource } from '../config/database.config';
import { Wallet } from '../Models/wallet.entity';
import { WalletTransaction } from '../Models/wallet-transaction.entity';
import { User } from '../Models/user.entity';
import { SavedCard } from '../Models/saved-card.entity';

export class WalletService {
    private walletRepo = AppDataSource.getRepository(Wallet);
    private transactionRepo = AppDataSource.getRepository(WalletTransaction);
    private userRepo = AppDataSource.getRepository(User);
    private savedCardRepo = AppDataSource.getRepository(SavedCard);

    private formatSavedCard(card: SavedCard) {
        return {
            id: card.id,
            brand: card.brand,
            last4: card.last4,
            expMonth: card.expMonth,
            expYear: card.expYear,
            cardholder: card.cardholder || undefined,
            isDefault: card.isDefault
        };
    }

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

        // Sort transactions by date without extra Date object churn when already Date.
        if (wallet.transactions.length > 1) {
            wallet.transactions.sort((a, b) => {
                const timeA = a.date instanceof Date ? a.date.getTime() : new Date(a.date).getTime();
                const timeB = b.date instanceof Date ? b.date.getTime() : new Date(b.date).getTime();
                return timeB - timeA;
            });
        }

        const transactions = new Array(wallet.transactions.length);
        for (let i = 0; i < wallet.transactions.length; i++) {
            const t = wallet.transactions[i];
            transactions[i] = {
                id: t.id,
                amount: Number(t.amount),
                type: t.type,
                description: t.description,
                date: t.date.toISOString(),
                reservation_id: t.reservation_id
            };
        }

        const savedCardEntities = await this.savedCardRepo.find({
            where: { user: { id: userId } },
            order: { isDefault: 'DESC', createdAt: 'DESC' }
        });
        const savedCards = savedCardEntities.map((card) => this.formatSavedCard(card));

        return {
            balance: Number(wallet.balance),
            currency: wallet.currency,
            transactions,
            savedCards
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

    async addTopUp(userId: number, amount: number, cardId?: number) {
        let description = 'Wallet Top-up';
        if (cardId) {
            const card = await this.savedCardRepo.findOne({
                where: { id: cardId, user: { id: userId } }
            });
            if (!card) {
                throw new Error('Saved card not found');
            }
            description = `Wallet Top-up (${card.brand} ****${card.last4})`;
        }
        return this.addCredit(userId, amount, description);
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

    async addSavedCard(userId: number, data: {
        brand: string;
        last4: string;
        expMonth: number;
        expYear: number;
        cardholder?: string;
        isDefault?: boolean;
    }) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) throw new Error('User not found');

        const brand = (data.brand || '').trim() || 'Card';
        const last4 = (data.last4 || '').replace(/\D/g, '');
        if (last4.length !== 4) {
            throw new Error('Invalid card last4');
        }
        const expMonth = Number(data.expMonth);
        let expYear = Number(data.expYear);
        if (expYear < 100) {
            expYear += 2000;
        }
        if (!Number.isFinite(expMonth) || expMonth < 1 || expMonth > 12) {
            throw new Error('Invalid expiration month');
        }
        if (!Number.isFinite(expYear) || expYear < 2000) {
            throw new Error('Invalid expiration year');
        }

        const existingCount = await this.savedCardRepo.count({
            where: { user: { id: userId } }
        });
        let makeDefault = !!data.isDefault;
        if (!makeDefault && existingCount === 0) {
            makeDefault = true;
        }
        if (makeDefault) {
            await this.savedCardRepo
                .createQueryBuilder()
                .update()
                .set({ isDefault: false })
                .where('"userId" = :userId', { userId })
                .execute();
        }

        const saved = this.savedCardRepo.create({
            user,
            brand,
            last4,
            expMonth,
            expYear,
            cardholder: data.cardholder?.trim() || undefined,
            isDefault: makeDefault
        });
        const result = await this.savedCardRepo.save(saved);
        return this.formatSavedCard(result);
    }
}
