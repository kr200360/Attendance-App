import { Router } from 'express';
import { SettingsController } from './settings.controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { updateSchoolSettingsSchema } from '@school/validation';

const router = Router();

router.use(authenticate);
router.use(requireRole('admin'));

router.get('/dashboard', SettingsController.getDashboardStats);
router.get('/audit-logs', SettingsController.getAuditLogs);
router.get('/settings', SettingsController.getSettings);
router.patch('/settings', validateBody(updateSchoolSettingsSchema), SettingsController.updateSettings);

export const settingsRouter = router;
