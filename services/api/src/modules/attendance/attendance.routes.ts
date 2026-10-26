import { Router } from 'express';
import { AttendanceController } from './attendance.controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import {
  createAttendanceSessionSchema,
  updateAttendanceRecordsSchema,
  submitAttendanceSchema,
  correctionRequestSchema
} from '@school/validation';

const router = Router();

router.use(authenticate);

// Sessions
router.post('/sessions', requireRole('teacher', 'admin'), validateBody(createAttendanceSessionSchema), AttendanceController.createSession);
router.get('/sessions', requireRole('teacher', 'admin'), AttendanceController.listSessions);
router.get('/sessions/:id', requireRole('teacher', 'admin'), AttendanceController.getSessionById);

// Records & Submission
router.put('/sessions/:id/records', requireRole('teacher', 'admin'), validateBody(updateAttendanceRecordsSchema), AttendanceController.saveDraftRecords);
router.post('/sessions/:id/submit', requireRole('teacher', 'admin'), validateBody(submitAttendanceSchema), AttendanceController.submitAttendance);

// Corrections
router.post('/sessions/:id/correction-requests', requireRole('teacher', 'admin'), validateBody(correctionRequestSchema), AttendanceController.requestCorrection);

// Student Attendance History (Accessible to Admin, Teacher, and Parent for their own child)
router.get('/students/:id/attendance', AttendanceController.getStudentAttendance);

export const attendanceRouter = router;
