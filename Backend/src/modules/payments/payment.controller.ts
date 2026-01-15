import { Request, Response } from 'express';
import { PaymentService } from './payment.service';

const service = new PaymentService();

export const getAllPayments = async (req: Request, res: Response) => {
  const data = await service.getAll();
  res.json(data);
};

export const getPaymentById = async (req: Request, res: Response) => {
  const data = await service.getById(Number(req.params.id));
  if (!data) return res.status(404).json({ message: "Payment not found" });
  res.json(data);
};

export const createPayment = async (req: Request, res: Response) => {
  const data = await service.create(req.body);
  res.status(201).json(data);
};

export const updatePayment = async (req: Request, res: Response) => {
  const data = await service.update(Number(req.params.id), req.body);
  if (!data) return res.status(404).json({ message: "Payment not found" });
  res.json(data);
};

export const deletePayment = async (req: Request, res: Response) => {
  const success = await service.delete(Number(req.params.id));
  if (!success) return res.status(404).json({ message: "Payment not found" });
  res.json({ message: "Deleted successfully" });
};
