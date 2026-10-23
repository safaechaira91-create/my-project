import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';

dotenv.config();

const config = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
};

if (
  !config.cloud_name ||
  !config.api_key ||
  !config.api_secret
) {
  throw new Error('Cloudinary environment variables are missing');
}

cloudinary.config(config);

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'mydar_properties',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    transformation: [
      {
        width: 1200,
        height: 800,
        crop: 'limit',
        quality: 'auto',
        fetch_format: 'auto',
      },
    ],
  },
});

export { cloudinary, storage }