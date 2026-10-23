import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { fileURLToPath } from 'url';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';

import connectDB from './config/db.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';
import { ensureUploadsDir } from './utils/localUpload.js';

// Route Imports
import authRoutes from './routes/authRoutes.js';
import propertyRoutes from './routes/propertyRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import userRoutes from './routes/userRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import supportRequestRoutes from './routes/supportRequestRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Global Middlewares
app.use(compression());
app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: 'cross-origin',
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        process.env.FRONTEND_URL,
        process.env.ADMIN_URL,
        'http://localhost:5173',
      ].filter(Boolean);

      const isNgrokOrigin = /^https:\/\/[a-z0-9-]+\.(?:ngrok-free\.(?:dev|app)|ngrok\.app)$/.test(
        origin || ''
      );

      if (!origin || allowedOrigins.includes(origin) || isNgrokOrigin) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(mongoSanitize());
app.set('trust proxy', 1);
app.disable('x-powered-by');

// Rate Limiting
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please try again later.' },
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/auth/reset-password', authLimiter);

// Serve Static Files
app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'), {
    setHeaders: (res) => {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    },
  })
);

// Health Check
app.get('/api/health', (req, res) =>
  res.json({ status: 'UP', timestamp: new Date() })
);

// API Endpoints
app.use('/api/auth', authRoutes);
// NOTE: '/api/listings' was removed - it duplicated '/api/properties' with a security
// gap (missing approved/availability filtering). All listing/property functionality
// now lives under '/api/properties'. If you still need '/api/listings' for backward
// compatibility with an old frontend build, mount propertyRoutes on it as an alias:
// app.use('/api/listings', propertyRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/support-requests', supportRequestRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/reviews', reviewRoutes);

// Serve Frontend in Production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));

  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(__dirname, '../dist/index.html'));
    }
  });
}

// Error Handling
app.use(notFound);
app.use(errorHandler);

// Global Error Handlers
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Start Server
const startServer = async () => {
  try {
    console.log('⏳ Connecting to MongoDB...');
    await connectDB();
    console.log('✅ MongoDB Connected.');

    ensureUploadsDir();

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://127.0.0.1:${PORT}`);
    });
  } catch (error) {
    console.error(`❌ Server Startup Error: ${error.message}`);
    process.exit(1);
  }
};

startServer();