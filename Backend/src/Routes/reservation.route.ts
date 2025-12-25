import { Router } from 'express';
import { ReservationService } from '../Services/reservation.service';

import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const service = new ReservationService();

// GET my bookings
router.get('/my-bookings', authMiddleware, async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: 'User not authenticated properly' });
    }
    const data = await service.getByUserId(req.user.userId);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error fetching bookings' });
  }
});

// GET all reservations
router.get('/', async (req, res) => {
  const data = await service.getAll();
  res.json(data);
});

// GET reservation by ID
router.get('/:id', async (req, res) => {
  const data = await service.getById(Number(req.params.id));
  if (!data) return res.status(404).json({ message: 'Reservation not found' });
  res.json(data);
});

// POST create reservation
router.post('/', authMiddleware, async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    const reservationData = {
      ...req.body,
      user: req.user.userId // Link reservation to logged-in user
    };
    const data = await service.create(reservationData);
    res.status(201).json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to create reservation' });
  }
});

// PUT update reservation
router.put('/:id', async (req, res) => {
  const data = await service.update(Number(req.params.id), req.body);
  if (!data) return res.status(404).json({ message: 'Reservation not found' });
  res.json(data);
});

// DELETE reservation
router.delete('/:id', async (req, res) => {
  const success = await service.delete(Number(req.params.id));
  if (!success) return res.status(404).json({ message: 'Reservation not found' });
  res.json({ message: 'Deleted successfully' });
});

export default router;
