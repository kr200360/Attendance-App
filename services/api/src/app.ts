import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import mongoose from 'mongoose';

import { config } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { swaggerDocument } from './docs/swagger';

import { authRouter } from './modules/auth/auth.routes';
import { studentRouter } from './modules/students/student.routes';
import { parentRouter } from './modules/parents/parent.routes';
import { academicRouter } from './modules/academic/academic.routes';
import { attendanceRouter } from './modules/attendance/attendance.routes';
import { leaveRequestRouter } from './modules/leave-requests/leave-request.routes';
import { notificationRouter } from './modules/notifications/notification.routes';
import { reportRouter } from './modules/reports/report.routes';
import { settingsRouter } from './modules/settings/settings.routes';

const app = express();

// Security Headers & CORS
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    return callback(null, true);
  },
  credentials: true
}));

// Request Logger
if (config.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // generous for normal school workflow
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use(limiter);

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Swagger Documentation
app.use(`${config.apiPrefix}/docs`, swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Mount API Modules
app.use(`${config.apiPrefix}/auth`, authRouter);
app.use(`${config.apiPrefix}/students`, studentRouter);
app.use(`${config.apiPrefix}/parents`, parentRouter);
app.use(`${config.apiPrefix}/attendance`, attendanceRouter);
app.use(`${config.apiPrefix}/leave-requests`, leaveRequestRouter);
app.use(`${config.apiPrefix}/notifications`, notificationRouter);
app.use(`${config.apiPrefix}/reports`, reportRouter);
app.use(`${config.apiPrefix}/admin`, settingsRouter);
app.use(`${config.apiPrefix}`, academicRouter); // Mounts /classes, /teachers, /teacher-assignments, /subjects, /timetable

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Global Error Handler
app.use(errorHandler);

export default app;
