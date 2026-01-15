import { Router } from 'express';
import * as WaitlistController from '../Controllers/waitlist.controller';

const router = Router();

router.post('/', WaitlistController.joinWaitlist);
router.get('/:lotId', WaitlistController.getWaitlistForLot);
router.post('/:id/notify', WaitlistController.markNotified);

export default router;
