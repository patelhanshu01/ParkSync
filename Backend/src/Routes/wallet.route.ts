import { Router } from 'express';
import { getWallet, topUp, applyCredit } from '../Controllers/wallet.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', getWallet);
router.post('/top-up', topUp);
router.post('/apply', applyCredit);

export default router;
