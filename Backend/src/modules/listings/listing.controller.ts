import { Request, Response } from 'express';
import { ListingService } from './listing.service';
import { ReservationService } from '../reservations/reservation.service';

const service = new ListingService();
const reservationService = new ReservationService();

export const getAllListings = async (_req: Request, res: Response) => {
  const data = await service.getAll();
  res.json({ results: data });
};

export const getListingById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const data = await service.getById(id);
  if (!data) return res.status(404).json({ message: 'Listing not found' });
  res.json(data);
};

export const createListing = async (req: Request, res: Response) => {
  const data = await service.create(req.body);
  res.status(201).json(data);
};

export const updateListing = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const updated = await service.update(id, req.body);
  if (!updated) return res.status(404).json({ message: 'Listing not found' });
  res.json(updated);
};

export const deleteListing = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const ok = await service.delete(id);
  if (!ok) return res.status(404).json({ message: 'Listing not found' });
  res.json({ message: 'Deleted' });
};

export const reserveListing = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const payload = {
      ...req.body,
      listing: { id },
      parkingLot: null, // explicit null to avoid mis-association
      user: req.user.userId
    };

    const reservation = await reservationService.create(payload as any);
    res.status(201).json(reservation);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to reserve listing' });
  }
};
