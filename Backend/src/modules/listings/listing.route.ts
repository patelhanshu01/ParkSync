import { Router } from 'express';
import * as ListingController from './listing.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

router.get('/', ListingController.getAllListings);
router.get('/:id', ListingController.getListingById);
router.post('/', ListingController.createListing);
router.put('/:id', ListingController.updateListing);
router.delete('/:id', ListingController.deleteListing);
router.post('/:id/reserve', authMiddleware, ListingController.reserveListing);

export default router;
