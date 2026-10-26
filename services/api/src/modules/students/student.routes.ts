import { Router } from 'express';
import { StudentController } from './student.controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { createStudentSchema, updateStudentSchema, createParentLinkSchema } from '@school/validation';

const router = Router();

router.use(authenticate);

router.get('/', requireRole('admin', 'teacher'), StudentController.listStudents);
router.post('/', requireRole('admin'), validateBody(createStudentSchema), StudentController.createStudent);
router.get('/:id', requireRole('admin', 'teacher', 'parent', 'student'), StudentController.getStudentById);
router.patch('/:id', requireRole('admin'), validateBody(updateStudentSchema), StudentController.updateStudent);
router.post('/:id/parent-links', requireRole('admin'), validateBody(createParentLinkSchema), StudentController.linkParent);

export const studentRouter = router;
