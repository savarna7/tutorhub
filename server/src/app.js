import express from 'express';
import cors from 'cors';
import pool from './db/pool.js';
import bookingRoutes from './routes/bookingRoutes.js';
import authRoutes from './routes/authRoutes.js';
import cookieParser from 'cookie-parser';
import tutorRoutes from './routes/tutorRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import originProtection from './middleware/originMiddleware.js';

const app = express();
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

// Middleware
const allowedOrigins = (
    process.env.CLIENT_ORIGINS || 'http://localhost:5173'
)
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// Validate the origin of state-changing requests.
app.use(originProtection);

// Routes
app.use('/api/bookings', bookingRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/tutors', tutorRoutes);
app.use('/api/profiles', profileRoutes);

// First API endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'TutorHub backend is running!',
  });
});

// Test PostgreSQL database connection
app.get('/api/db-test', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT current_database(), NOW()'
    );

    res.status(200).json({
      success: true,
      message: 'PostgreSQL connected successfully!',
      database: result.rows[0].current_database,
      time: result.rows[0].now,
    });

  } catch (error) {
    console.error('Database connection error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Database connection failed.',
    });
  }
});

export default app;
