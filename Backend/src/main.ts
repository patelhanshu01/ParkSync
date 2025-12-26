import express from 'express';
import cors from 'cors';
import { AppDataSource } from './config/database.config';

// Import routes
import authRoutes from './Routes/auth.route';
import parkingRoutes from './Routes/parking.route';
import paymentRoutes from './Routes/payment.route';
import reservationRoutes from './Routes/reservation.route';
import userRoutes from './Routes/user.route';
import co2Routes from './Routes/co2.route';
import listingRoutes from './Routes/listing.route';
// queue feature removed - routes cleaned up
import walletRoutes from './Routes/wallet.route';
import { seedMarketplace } from './seed';

const app = express();

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (origin.indexOf('localhost') !== -1) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: AppDataSource.isInitialized ? 'Connected' : 'Disconnected',
  });
});

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/parking', parkingRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/reservation', reservationRoutes);
app.use('/api/user', userRoutes);
app.use('/api/co2', co2Routes);
app.use('/api/listings', listingRoutes);
// queue feature removed - no queue routes mounted
app.use('/api/wallet', walletRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Connect DB then start server
const PORT = process.env.PORT || 3000;

AppDataSource.initialize()
  .then(() => {
    console.log('✅ Database connected successfully!');
    seedMarketplace().catch(err => console.error('Seeding error:', err));

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`📚 API Base URL: http://localhost:${PORT}/api`);
    });
  })
  .catch((err) => {
    console.error('❌ Database connection error:', err);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
  process.exit(0);
});