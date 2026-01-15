import { Router } from 'express';
import { UserService } from '../Services/user.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { generateToken } from '../config/jwt.config';

const router = Router();
const service = new UserService();

// GET all users
router.get('/', async (req, res) => {
  const data = await service.getAll();
  res.json(data);
});

// GET user by ID
router.get('/:id', async (req, res) => {
  const data = await service.getById(Number(req.params.id));
  if (!data) return res.status(404).json({ message: 'User not found' });
  res.json(data);
});

// POST host application (upgrade to admin)
router.post('/host-application', authMiddleware, async (req, res) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const {
      bankName,
      accountHolder,
      accountNumber,
      routingNumber,
      payoutEmail
    } = req.body || {};

    if (!bankName || !accountHolder || !accountNumber || !routingNumber) {
      return res.status(400).json({ message: 'Missing required bank details' });
    }

    const updated = await service.update(req.user.userId, {
      role: 'admin',
      hostBankName: bankName,
      hostAccountHolder: accountHolder,
      hostAccountNumber: accountNumber,
      hostRoutingNumber: routingNumber,
      hostPayoutEmail: payoutEmail || null,
      hostStatus: 'approved',
      hostAppliedAt: new Date()
    });

    if (!updated) {
      return res.status(404).json({ message: 'User not found' });
    }

    const token = generateToken({
      userId: updated.id,
      email: updated.email,
      role: updated.role
    });

    res.json({
      token,
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        role: updated.role
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to apply for host' });
  }
});

// POST create user
router.post('/', async (req, res) => {
  const data = await service.create(req.body);
  res.status(201).json(data);
});

// PUT update user
router.put('/:id', async (req, res) => {
  const data = await service.update(Number(req.params.id), req.body);
  if (!data) return res.status(404).json({ message: 'User not found' });
  res.json(data);
});

// DELETE user
router.delete('/:id', async (req, res) => {
  const success = await service.delete(Number(req.params.id));
  if (!success) return res.status(404).json({ message: 'User not found' });
  res.json({ message: 'Deleted successfully' });
});

export default router;
