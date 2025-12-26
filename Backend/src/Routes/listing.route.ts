import { Router } from 'express';
import * as ListingController from '../Controllers/listing.controller';

const router = Router();

router.get('/', ListingController.getAllListings);
router.get('/:id', ListingController.getListingById);
router.post('/', ListingController.createListing);
router.put('/:id', ListingController.updateListing);
router.delete('/:id', ListingController.deleteListing);

export default router;
