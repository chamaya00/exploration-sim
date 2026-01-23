import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRouter from './api';
import { startTickScheduler } from './jobs/tick-scheduler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// API routes
app.use('/api', apiRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // Start tick scheduler in development
  if (process.env.NODE_ENV === 'development' || process.env.ENABLE_TICK_SCHEDULER === 'true') {
    startTickScheduler();
  }
});

export default app;
