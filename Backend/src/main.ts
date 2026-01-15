import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import xss from 'xss';
import { AppDataSource } from './config/database.config';

// Import routes
import authRoutes from './Routes/auth.route';
import parkingRoutes from './modules/parking/parking.route';
import paymentRoutes from './modules/payments/payment.route';
import reservationRoutes from './modules/reservations/reservation.route';
import userRoutes from './Routes/user.route';
import co2Routes from './Routes/co2.route';
import listingRoutes from './modules/listings/listing.route';
// queue feature removed - routes cleaned up
import walletRoutes from './Routes/wallet.route';
import waitlistRoutes from './Routes/waitlist.route';
import analyticsRoutes from './Routes/analytics.route';
import { seedMarketplace } from './seed';
import { ReservationLifecycleService } from './Services/reservation-lifecycle.service';

const app = express();
const reservationLifecycle = new ReservationLifecycleService();

// ============================================
// SECURITY MIDDLEWARE
// ============================================

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.originalUrl}`);
  res.on('finish', () => {
    console.log(`ox ${req.method} ${req.originalUrl} -> ${res.statusCode}`);
  });
  next();
});

// Helmet for HTTP security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      connectSrc: ["'self'", "https://maps.googleapis.com", "https://accounts.google.com", "http://localhost:*"],
    },
  },
  crossOriginEmbedderPolicy: false, // Needed for Google Maps
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' }, // Allow OAuth popups
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' } // Required for Google Sign-In
}));

const isDev = process.env.NODE_ENV !== 'production';
console.log(`🔧 Environment: ${isDev ? 'Development' : 'Production'} | Rate Limiting: ${isDev ? 'Skipped' : 'Enabled (Max 2000)'}`);

// Rate limiting - General API limit
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 10000 : 2000, // Increased from 200 to 2000 to prevent 503s on photo grids
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
  skip: () => isDev
});

// Rate limiting - Strict for auth endpoints (prevents brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 1000 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts, please try again after 15 minutes.' },
  skipSuccessfulRequests: true, // Don't count successful logins
  skip: () => isDev
});

// XSS Sanitization middleware - sanitizes all string inputs
const sanitizeInput = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.body) {
    const sanitizeObject = (obj: any): any => {
      if (typeof obj === 'string') {
        return xss(obj);
      }
      if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
      }
      if (obj && typeof obj === 'object') {
        const sanitized: any = {};
        for (const key of Object.keys(obj)) {
          sanitized[key] = sanitizeObject(obj[key]);
        }
        return sanitized;
      }
      return obj;
    };
    req.body = sanitizeObject(req.body);
  }
  next();
};

// ============================================
// CORS & BODY PARSING
// ============================================

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

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply XSS sanitization to all requests
app.use(sanitizeInput);

// ============================================
// RATE LIMITING
// ============================================

// Apply general rate limiting to all API routes
app.use('/api', generalLimiter);

// Apply strict rate limiting to auth routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: AppDataSource.isInitialized ? 'Connected' : 'Disconnected',
    security: {
      helmet: true,
      rateLimiting: true,
      xssSanitization: true
    }
  });
});

// ============================================
// ROUTES
// ============================================

app.use('/api/auth', authRoutes);
app.use('/api/parking', parkingRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/reservation', reservationRoutes);
app.use('/api/user', userRoutes);
app.use('/api/co2', co2Routes);
app.use('/api/listings', listingRoutes);
app.use('/api/waitlist', waitlistRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/wallet', walletRoutes);

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ============================================
// SERVER STARTUP
// ============================================

const PORT = process.env.PORT || 3000;

AppDataSource.initialize()
  .then(() => {
    console.log('✅ Database connected successfully!');

    // Warn if using default JWT secret
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your-secret-key') {
      console.warn('⚠️  WARNING: Using default JWT secret. Set JWT_SECRET env var in production!');
    }

    if (process.env.SEED_ON_START === 'true') {
      seedMarketplace().catch(err => console.error('Seeding error:', err?.message || err));
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`📚 API Base URL: http://localhost:${PORT}/api`);
      console.log(`🔒 Security: Helmet, Rate Limiting, XSS Protection enabled`);
      reservationLifecycle.start();
    });
  })
  .catch((err) => {
    console.error('❌ Database connection error:', err);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  reservationLifecycle.stop();
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
  process.exit(0);
});
