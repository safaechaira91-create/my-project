import express from 'express';
import {
  createReview,
  getReviewsByListing,
  replyToReview,
  deleteReview,
} from '../controllers/reviewController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public: anyone can read reviews for a listing
router.get('/listing/:listingId', getReviewsByListing);

// Private: must be logged in
router.post('/', protect, createReview);
router.put('/:id/reply', protect, replyToReview);
router.delete('/:id', protect, deleteReview);

export default router;