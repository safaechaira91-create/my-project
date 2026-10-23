import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

mongoose.set('strictQuery', true);

// تسجيل الـ Listeners مرة وحدة فقط (خارج الدالة باش ما يتكررش)
mongoose.connection.on('disconnected', () => {
  console.warn('⚠ MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err.message);
});

const connectDB = async () => {
  const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

  try {
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    if (mongoose.connection.readyState >= 1) {
      return;
    }

    await mongoose.connect(MONGODB_URI, {
      dbName: 'MyDar',
      serverSelectionTimeoutMS: Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS) || 10000,
      socketTimeoutMS: Number(process.env.MONGO_SOCKET_TIMEOUT_MS) || 45000,
      maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE) || 10,
    });

    console.log('📡 MongoDB Connected to MyDar');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

export default connectDB;