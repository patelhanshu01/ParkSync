import { Router } from 'express';
import { UserService } from '../Services/user.service';

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
