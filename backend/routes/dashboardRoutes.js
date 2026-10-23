import express from 'express';
import { getHostStats } from '../controllers/dashboardController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Get host dashboard statistics
// @access  Private (Host/Admin)
router.get('/stats', protect, authorize('host', 'admin'), getHostStats);

export default router;