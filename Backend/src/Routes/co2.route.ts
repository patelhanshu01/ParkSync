import { Router } from 'express';
import { calculateScore, compareLots } from '../Controllers/co2.controller';

const router = Router();

router.post('/score', calculateScore);
router.post('/compare', compareLots);

export default router;
