import { Request, Response, NextFunction } from 'express';
import { AttendanceService } from './attendance.service';
import { sendSuccess } from '../../shared/response';
import { AuthenticatedRequest } from '../../middleware/auth';

export class AttendanceController {
  public static async createSession(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await AttendanceService.getOrCreateSession({
        ...req.body,
        userId: req.user!._id.toString(),
        userRole: req.user!.role
      });
      return sendSuccess(res, data, 'Attendance session ready');
    } catch (error) {
      next(error);
    }
  }

  public static async listSessions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const filter: any = { ...req.query };
      if (req.user!.role === 'teacher') {
        filter.teacherId = req.user!._id.toString();
      }
      const data = await AttendanceService.listSessions(filter);
      return sendSuccess(res, data.sessions, 'Attendance sessions retrieved', 200, {
        total: data.total,
        page: data.page,
        totalPages: data.totalPages
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getSessionById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await AttendanceService.getSessionDetails(req.params.id);
      return sendSuccess(res, data, 'Attendance session retrieved');
    } catch (error) {
      next(error);
    }
  }

  public static async saveDraftRecords(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await AttendanceService.saveDraftRecords(
        req.params.id,
        req.body.records,
        req.user!._id.toString()
      );
      return sendSuccess(res, data, 'Attendance draft saved successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async submitAttendance(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await AttendanceService.submitAttendance(
        req.params.id,
        req.body.records,
        req.user!._id.toString()
      );
      return sendSuccess(res, data, 'Attendance submitted successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async requestCorrection(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await AttendanceService.submitCorrectionRequest(
        req.params.id,
        req.body,
        req.user!._id.toString()
      );
      return sendSuccess(res, data, 'Attendance correction recorded successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async getStudentAttendance(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await AttendanceService.getStudentAttendance(req.params.id, req.user);
      return sendSuccess(res, data, 'Student attendance history retrieved');
    } catch (error) {
      next(error);
    }
  }
}
