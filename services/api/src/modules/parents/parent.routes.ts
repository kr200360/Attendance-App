import { Router } from 'express';
import { ParentController } from './parent.controller';
import { authenticate, requireRole } from '../../middleware/auth';

const router = Router();

router.use(authenticate);
router.get('/me/children', requireRole('parent', 'admin'), ParentController.getMyChildren);

export const parentRouter = router;
