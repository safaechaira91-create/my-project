import express from 'express';
import {
  createSupportRequest,
  getSupportRequests,
  approveHostRequest,
  rejectHostRequest,
} from '../controllers/supportRequestController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router
  .route('/')
  .post(protect, createSupportRequest)
  .get(protect, authorize('admin'), getSupportRequests);

router.put('/:id/approve', protect, authorize('admin'), approveHostRequest);
router.put('/:id/reject', protect, authorize('admin'), rejectHostRequest);

export default router;