import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import 'express-async-errors';
import mongoose from 'mongoose';
import { initializeDefaultTrustAuthority } from './utils/initializeDefaultTA.js';
// Import routes
import authRoutes from './routes/auth.js';
import certificateRoutes from './routes/certificates.js';
import keyRoutes from './routes/keys.js';
import userRoutes from './routes/users.js';
import auditRoutes from './routes/auditLogs.js';
import trustAuthorityRoutes from './routes/trustAuthority.js';
import cryptoPoliciesRoutes from './routes/cryptoPolicies.js';
import verificationRoutes from './routes/verification.js';

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/scklms');


    console.log('[MongoDB] Connected:', conn.connection.host);
    return conn;
  } catch (error) {
    console.error('[MongoDB ERROR]', error.message);
    process.exit(1);
  }
};

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/keys', keyRoutes);
app.use('/api/users', userRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/trust-authority', trustAuthorityRoutes);
app.use('/api/crypto-policies', cryptoPoliciesRoutes);
app.use('/api/verification', verificationRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
  });
});

// Initialize server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
await initializeDefaultTrustAuthority();
    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════════╗
║   SCKLMS Backend Server is Running              ║
║   http://localhost:${PORT}                     ║
║   Environment: ${process.env.NODE_ENV || 'development'}                   ║
╚════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('[STARTUP ERROR]', error);
    process.exit(1);
  }
};

startServer();

export default app;
