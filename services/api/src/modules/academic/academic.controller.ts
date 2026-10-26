import { Request, Response, NextFunction } from 'express';
import { AcademicService } from './academic.service';
import { sendSuccess } from '../../shared/response';
import { AuthenticatedRequest } from '../../middleware/auth';

export class AcademicController {
  // Academic Years
  public static async getAcademicYears(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await AcademicService.getAcademicYears();
      return sendSuccess(res, data, 'Academic years retrieved');
    } catch (error) {
      next(error);
    }
  }

  public static async createAcademicYear(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await AcademicService.createAcademicYear(req.body, req.user!._id.toString());
      return sendSuccess(res, data, 'Academic year created', 201);
    } catch (error) {
      next(error);
    }
  }

  // Classes
  public static async listClasses(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await AcademicService.listClasses(req.query.academicYearId as string);
      return sendSuccess(res, data, 'Classes retrieved');
    } catch (error) {
      next(error);
    }
  }

  public static async createClass(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await AcademicService.createClass(req.body, req.user!._id.toString());
      return sendSuccess(res, data, 'Class created', 201);
    } catch (error) {
      next(error);
    }
  }

  public static async getClassRoster(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await AcademicService.getClassRoster(
        req.params.classId,
        req.user?._id.toString(),
        req.user?.role
      );
      return sendSuccess(res, data, 'Class roster retrieved');
    } catch (error) {
      next(error);
    }
  }

  // Subjects
  public static async listSubjects(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await AcademicService.listSubjects();
      return sendSuccess(res, data, 'Subjects retrieved');
    } catch (error) {
      next(error);
    }
  }

  public static async createSubject(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await AcademicService.createSubject(req.body);
      return sendSuccess(res, data, 'Subject created', 201);
    } catch (error) {
      next(error);
    }
  }

  // Teachers
  public static async listTeachers(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await AcademicService.listTeachers();
      return sendSuccess(res, data, 'Teachers retrieved');
    } catch (error) {
      next(error);
    }
  }

  public static async createTeacher(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await AcademicService.createTeacher(req.body, req.user!._id.toString());
      return sendSuccess(res, data, 'Teacher created', 201);
    } catch (error) {
      next(error);
    }
  }

  // Assignments
  public static async assignTeacher(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await AcademicService.assignTeacher(req.body, req.user!._id.toString());
      return sendSuccess(res, data, 'Teacher assigned successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  public static async getMyTeacherAssignments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await AcademicService.getTeacherAssignments(req.user!._id.toString());
      return sendSuccess(res, data, 'Teacher assignments retrieved');
    } catch (error) {
      next(error);
    }
  }

  // Timetable
  public static async getTimetable(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await AcademicService.getTimetable(
        req.query.classId as string,
        req.query.teacherId as string
      );
      return sendSuccess(res, data, 'Timetable retrieved');
    } catch (error) {
      next(error);
    }
  }

  public static async createTimetablePeriod(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await AcademicService.createTimetablePeriod(req.body);
      return sendSuccess(res, data, 'Timetable period created', 201);
    } catch (error) {
      next(error);
    }
  }
}
