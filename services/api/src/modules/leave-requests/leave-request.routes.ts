import { Router } from 'express';
import { LeaveRequestController } from './leave-request.controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { createLeaveRequestSchema, reviewLeaveRequestSchema } from '@school/validation';

const router = Router();

router.use(authenticate);

router.post('/', requireRole('parent'), validateBody(createLeaveRequestSchema), LeaveRequestController.create);
router.get('/', LeaveRequestController.list);
router.patch('/:id', requireRole('admin', 'teacher'), validateBody(reviewLeaveRequestSchema), LeaveRequestController.review);

export const leaveRequestRouter = router;
