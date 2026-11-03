
import express from 'express';
import cors from 'cors';
import pool from './db/pool.js';
import bookingRoutes from './routes/bookingRoutes.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/api/bookings', bookingRoutes);

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
