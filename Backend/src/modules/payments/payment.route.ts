import { Router } from 'express';
import { PaymentService } from './payment.service';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();
const service = new PaymentService();

// GET all payments
router.get('/', authMiddleware, async (req, res) => {
  const data = await service.getAll();
  res.json(data);
});

// GET payment by ID
router.get('/:id', authMiddleware, async (req, res) => {
  const data = await service.getById(Number(req.params.id));
  if (!data) return res.status(404).json({ message: 'Payment not found' });
  res.json(data);
});

// POST create payment
router.post('/', authMiddleware, async (req, res) => {
  try {
    const paymentData = {
      ...req.body,
      user: { id: req.user?.userId } // Link to authenticated user
    };
    const data = await service.create(paymentData);
    res.status(201).json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to create payment' });
  }
});

// PUT update payment
router.put('/:id', async (req, res) => {
  const data = await service.update(Number(req.params.id), req.body);
  if (!data) return res.status(404).json({ message: 'Payment not found' });
  res.json(data);
});

// DELETE payment
router.delete('/:id', async (req, res) => {
  const success = await service.delete(Number(req.params.id));
  if (!success) return res.status(404).json({ message: 'Payment not found' });
  res.json({ message: 'Deleted successfully' });
});

export default router;
