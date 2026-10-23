import express from 'express';
import multer from 'multer';
import { storage } from '../config/cloudinary.js';
import {
  getAllListings,
  getListingById,
  getMyListings,
  createListing,
  updateListing,
  deleteListing,
  uploadPropertyImages,
} from '../controllers/propertyController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Max 5MB per file
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpg, jpeg, png, webp)'));
    }
  },
});

// 1. المسارات العامة والإنشاء
router.get('/', getAllListings);
router.post('/', protect, authorize('host', 'admin'), createListing);

// 2. مسارات خاصة بالمستضيف والرفع (توضع قبل المسارات الحركية /:id)
router.get('/my-listings', protect, authorize('host', 'admin'), getMyListings);
router.post(
  '/upload',
  protect,
  authorize('host', 'admin'),
  upload.array('images', 10),
  uploadPropertyImages
);

// 3. المسارات المعتمدة على معرّف العقار (/:id)
router.get('/:id', getListingById);
router.put('/:id', protect, authorize('host', 'admin'), updateListing);
router.delete('/:id', protect, authorize('host', 'admin'), deleteListing);

export default router;