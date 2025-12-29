import { Router } from 'express';
import { AuthService } from '../Services/auth.service';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const authService = new AuthService();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const result = await authService.register({ name, email, password, role });
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const result = await authService.login({ email, password });
    res.json(result);
  } catch (error: any) {
    res.status(401).json({ message: error.message || 'Login failed' });
  }
});

// POST /api/auth/google-login
router.post('/google-login', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'Token required' });

    const result = await authService.googleLogin(token);
    res.json(result);
  } catch (error: any) {
    res.status(401).json({ message: error.message || 'Google login failed' });
  }
});

// GET /api/auth/me (Protected route)
router.get('/me', authMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const user = await authService.getCurrentUser(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// POST /api/auth/validate
router.post('/validate', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Token required' });
    }

    const payload = await authService.validateToken(token);
    res.json({ valid: true, payload });
  } catch (error: any) {
    res.status(401).json({ valid: false, message: 'Invalid token' });
  }
});

export default router;
