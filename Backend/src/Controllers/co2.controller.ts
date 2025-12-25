import { Request, Response } from 'express';
import { CO2Service } from '../Services/co2.service';

const service = new CO2Service();

export const calculateScore = async (req: Request, res: Response) => {
    try {
        const result = service.calculateCO2(req.body);
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const compareLots = async (req: Request, res: Response) => {
    try {
        const { lot_ids } = req.body;
        if (!Array.isArray(lot_ids)) {
            return res.status(400).json({ message: 'lot_ids must be an array' });
        }

        // Mock data for now - in real app, fetch from DB
        const lots = lot_ids.map(id => ({
            id,
            co2_estimated_g: Math.random() * 500 // Random for demo
        }));

        const result = service.compareLots(lots);
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};
