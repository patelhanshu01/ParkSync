import { Router } from 'express';
import * as AnalyticsController from '../Controllers/analytics.controller';

const router = Router();

router.get('/summary', AnalyticsController.getSummary);

export default router;
