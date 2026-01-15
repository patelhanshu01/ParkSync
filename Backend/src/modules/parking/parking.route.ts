import { Router } from 'express';
import * as ParkingController from './parking.controller';

const router = Router();

router.get('/stream', ParkingController.streamAvailability);
router.get('/photo', ParkingController.getParkingPhoto);
router.get('/', ParkingController.getAllParking);
router.get('/:id', ParkingController.getParkingById);
router.post('/', ParkingController.createParking);
router.put('/:id', ParkingController.updateParking);
router.delete('/:id', ParkingController.deleteParking);

export default router;
