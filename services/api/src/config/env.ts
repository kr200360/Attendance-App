import dotenv from 'dotenv';
import path from 'path';

// Load .env from api directory or project root
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  corsOrigin: (process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:8081,http://localhost:5173').split(','),
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/school_attendance',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'edutrack-access-secret-default-change-in-production-123456',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'edutrack-refresh-secret-default-change-in-production-789012',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '1h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },
  fcm: {
    projectId: process.env.FCM_PROJECT_ID,
    clientEmail: process.env.FCM_CLIENT_EMAIL,
    privateKey: process.env.FCM_PRIVATE_KEY
  },
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: parseInt(process.env.SMTP_PORT || '2525', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'EduTrack Attendance <noreply@edutrack.school>'
  }
};
