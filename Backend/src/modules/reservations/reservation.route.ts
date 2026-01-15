import { Router } from 'express';
import { ReservationService } from './reservation.service';
import { authMiddleware, roleMiddleware } from '../../middleware/auth.middleware';

const router = Router();
const service = new ReservationService();

const ensureOwnerOrAdmin = (req: any, res: any, reservation: any) => {
  if (req.user?.role !== 'admin' && reservation.user?.id !== req.user?.userId) {
    res.status(403).json({ message: 'Access denied' });
    return false;
  }
  return true;
};

// GET my bookings - User can only see their own bookings
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

// GET all reservations - Admin only
router.get('/', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const data = await service.getAll();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error fetching reservations' });
  }
});

// POST toggle auto-extend settings
router.post('/:id/auto-extend', authMiddleware, async (req, res) => {
  try {
    const reservation = await service.getById(Number(req.params.id));
    if (!reservation) return res.status(404).json({ message: 'Reservation not found' });
    if (!ensureOwnerOrAdmin(req, res, reservation)) return;
    if (reservation.endedAt) {
      return res.status(400).json({ message: 'Reservation already ended' });
    }

    const { enabled, intervalMinutes, capMinutes } = req.body;
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ message: 'enabled must be a boolean' });
    }

    const data = await service.setAutoExtend(Number(req.params.id), {
      enabled,
      intervalMinutes: typeof intervalMinutes === 'number' ? intervalMinutes : undefined,
      capMinutes: typeof capMinutes === 'number' ? capMinutes : undefined
    });

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to update auto-extend' });
  }
});

// POST manual extend
router.post('/:id/extend', authMiddleware, async (req, res) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: 'User not authenticated properly' });
    }
    const reservation = await service.getById(Number(req.params.id));
    if (!reservation) return res.status(404).json({ message: 'Reservation not found' });
    if (!ensureOwnerOrAdmin(req, res, reservation)) return;

    const { minutes } = req.body;
    if (typeof minutes !== 'number') {
      return res.status(400).json({ message: 'minutes must be a number' });
    }

    const data = await service.extendReservation(Number(req.params.id), minutes, req.user.userId as number);
    res.json(data);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to extend reservation' });
  }
});

// POST end reservation (exit signal)
router.post('/:id/end', authMiddleware, async (req, res) => {
  try {
    const reservation = await service.getById(Number(req.params.id));
    if (!reservation) return res.status(404).json({ message: 'Reservation not found' });
    if (!ensureOwnerOrAdmin(req, res, reservation)) return;

    const data = await service.endReservation(Number(req.params.id));
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to end reservation' });
  }
});

// GET reservation by ID - Auth required, user can only access their own (or admin)
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const data = await service.getById(Number(req.params.id));
    if (!data) return res.status(404).json({ message: 'Reservation not found' });

    // Check ownership - user can only view their own reservations unless admin
    if (!ensureOwnerOrAdmin(req, res, data)) return;

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error fetching reservation' });
  }
});

// POST create reservation - Auth required
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

// PUT update reservation - Auth required, ownership check
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    // First fetch to check ownership
    const existing = await service.getById(Number(req.params.id));
    if (!existing) return res.status(404).json({ message: 'Reservation not found' });

    // Check ownership
    if (req.user?.role !== 'admin' && existing.user?.id !== req.user?.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const data = await service.update(Number(req.params.id), req.body);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error updating reservation' });
  }
});

// DELETE reservation - Auth required, ownership check
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    // First fetch to check ownership
    const existing = await service.getById(Number(req.params.id));
    if (!existing) return res.status(404).json({ message: 'Reservation not found' });

    // Check ownership
    if (req.user?.role !== 'admin' && existing.user?.id !== req.user?.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const success = await service.delete(Number(req.params.id));
    res.json({ message: 'Deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error deleting reservation' });
  }
});

export default router;
