import { Request, Response } from 'express';
import { AppDataSource } from '../config/database.config';
import { WaitlistEntry } from '../Models/waitlist-entry.entity';
import { ParkingLot } from '../Models/parking-lot.entity';
import { User } from '../Models/user.entity';

const waitlistRepo = () => AppDataSource.getRepository(WaitlistEntry);
const lotRepo = () => AppDataSource.getRepository(ParkingLot);
const userRepo = () => AppDataSource.getRepository(User);

export const joinWaitlist = async (req: Request, res: Response) => {
  const { parkingLotId, userId, contact_email, phone } = req.body;
  const lot = await lotRepo().findOne({ where: { id: parkingLotId } });
  if (!lot) return res.status(404).json({ message: 'Parking lot not found' });

  let user: User | null = null;
  if (userId) {
    user = await userRepo().findOne({ where: { id: userId } });
  }

  const entry = waitlistRepo().create({
    parkingLot: lot,
    user: user || null,
    contact_email,
    phone,
    status: 'pending'
  });
  const saved = await waitlistRepo().save(entry);
  res.status(201).json(saved);
};

export const getWaitlistForLot = async (req: Request, res: Response) => {
  const lotId = Number(req.params.lotId);
  const entries = await waitlistRepo().find({
    where: { parkingLot: { id: lotId } },
    relations: ['parkingLot', 'user'],
    order: { createdAt: 'ASC' }
  });
  res.json(entries);
};

export const markNotified = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await waitlistRepo().update(id, { status: 'notified' as any });
  const updated = await waitlistRepo().findOne({ where: { id } });
  if (!updated) return res.status(404).json({ message: 'Waitlist entry not found' });
  res.json(updated);
};
