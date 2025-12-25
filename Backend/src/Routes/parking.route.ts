import { Router } from 'express';
import * as ParkingController from '../Controllers/parking.controller';

const router = Router();

router.get('/', ParkingController.getAllParking);
router.get('/:id', ParkingController.getParkingById);
router.post('/', ParkingController.createParking);
router.put('/:id', ParkingController.updateParking);
router.delete('/:id', ParkingController.deleteParking);

export default router;
