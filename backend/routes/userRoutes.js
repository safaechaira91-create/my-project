import express from 'express';
import {
  deleteUserAccount,
  getWishlist,
  addWishlistItem,
  removeWishlistItem,
} from '../controllers/userController.js';
import { updateUserProfile } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router
  .route('/profile')
  .put(updateUserProfile)
  .patch(updateUserProfile)
  .delete(deleteUserAccount);

router
  .route('/wishlist')
  .get(getWishlist)
  .post(addWishlistItem);

router
  .route('/wishlist/:listingId')
  .delete(removeWishlistItem);

export default router;