import express from 'express';
import multer from 'multer';
import { storage, cloudinary } from '../config/cloudinary.js';
import asyncHandler from 'express-async-handler';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/jpg',
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// @desc    Upload multiple images to Cloudinary
// @route   POST /api/upload
// @access  Private (Host/Admin)
router.post(
  '/',
  protect,
  authorize('host', 'admin'),
  upload.array('images', 10),
  asyncHandler(async (req, res) => {
    if (!req.files || req.files.length === 0) {
      res.status(400);
      throw new Error('المرجو تحميل صور');
    }

    const response = req.files.map((file) => ({
      url: file.secure_url || file.path,
      public_id: file.filename || file.public_id,
    }));
    res.json(response);
  })
);

// @desc    Delete image from Cloudinary
// @route   DELETE /api/upload/:publicId
// @access  Private (Host/Admin)
router.delete(
  '/:publicId(*)',
  protect,
  authorize('host', 'admin'),
  asyncHandler(async (req, res) => {
    const { publicId } = req.params;

    if (!publicId || publicId.length > 200) {
      res.status(400);
      throw new Error('Invalid image id');
    }
    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result !== 'ok') {
      res.status(404);
      throw new Error('Image not found');
    }
    res.json({ message: 'تم حذف الصورة بنجاح' });
  })
);

export default router;