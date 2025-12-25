import { Request, Response } from 'express';
import { WalletService } from '../Services/wallet.service';

const service = new WalletService();

export const getWallet = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId ?? Number(req.user?.id);
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const result = await service.getWallet(userId);
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const topUp = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId ?? Number(req.user?.id);
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const { amount } = req.body;
        const result = await service.addCredit(userId, amount, 'Wallet Top-up');
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const applyCredit = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId ?? Number(req.user?.id);
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const { reservation_id, amount } = req.body;
        const result = await service.applyToBooking(userId, reservation_id, amount);
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};
