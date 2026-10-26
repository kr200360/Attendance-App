import { Router } from 'express';
import { ReportController } from './report.controller';
import { authenticate, requireRole } from '../../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(requireRole('admin', 'teacher'));

router.get('/attendance/daily', ReportController.getDailyReport);
router.get('/attendance/monthly', ReportController.getMonthlyReport);
router.get('/attendance/below-threshold', ReportController.getBelowThreshold);
router.get('/attendance/export', ReportController.exportCsv);

export const reportRouter = router;
