import { Request, Response } from 'express';
import { ReservationService } from '../Services/reservation.service';

const service = new ReservationService();

export const getAllReservations = async (req: Request, res: Response) => {
  const data = await service.getAll();
  res.json(data);
};

export const getReservationById = async (req: Request, res: Response) => {
  const data = await service.getById(Number(req.params.id));
  if (!data) return res.status(404).json({ message: "Reservation not found" });
  res.json(data);
};

export const createReservation = async (req: Request, res: Response) => {
  const data = await service.create(req.body);
  res.status(201).json(data);
};

export const updateReservation = async (req: Request, res: Response) => {
  const data = await service.update(Number(req.params.id), req.body);
  if (!data) return res.status(404).json({ message: "Reservation not found" });
  res.json(data);
};

export const deleteReservation = async (req: Request, res: Response) => {
  const success = await service.delete(Number(req.params.id));
  if (!success) return res.status(404).json({ message: "Reservation not found" });
  res.json({ message: "Deleted successfully" });
};
