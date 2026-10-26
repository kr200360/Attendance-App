import { Router } from 'express';
import { AcademicController } from './academic.controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import {
  createClassSchema,
  createAcademicYearSchema,
  createTeacherSchema,
  assignTeacherSchema,
  createSubjectSchema,
  createTimetablePeriodSchema
} from '@school/validation';

const router = Router();

router.use(authenticate);

// Academic Years
router.get('/academic-years', AcademicController.getAcademicYears);
router.post('/academic-years', requireRole('admin'), validateBody(createAcademicYearSchema), AcademicController.createAcademicYear);

// Classes
router.get('/classes', AcademicController.listClasses);
router.post('/classes', requireRole('admin'), validateBody(createClassSchema), AcademicController.createClass);
router.get('/classes/:classId/roster', AcademicController.getClassRoster);

// Teachers
router.get('/teachers', requireRole('admin'), AcademicController.listTeachers);
router.post('/teachers', requireRole('admin'), validateBody(createTeacherSchema), AcademicController.createTeacher);

// Teacher Assignments
router.post('/teacher-assignments', requireRole('admin'), validateBody(assignTeacherSchema), AcademicController.assignTeacher);
router.get('/teacher-assignments/me', requireRole('teacher', 'admin'), AcademicController.getMyTeacherAssignments);

// Subjects
router.get('/subjects', AcademicController.listSubjects);
router.post('/subjects', requireRole('admin'), validateBody(createSubjectSchema), AcademicController.createSubject);

// Timetable
router.get('/timetable', AcademicController.getTimetable);
router.post('/timetable', requireRole('admin'), validateBody(createTimetablePeriodSchema), AcademicController.createTimetablePeriod);

export const academicRouter = router;
