import { Request, Response, NextFunction } from 'express';
import { SchoolSettings } from './school-settings.model';
import { User } from '../users/user.model';
import { Student } from '../students/student.model';
import { ClassModel } from '../academic/class.model';
import { AttendanceSession } from '../attendance/attendance-session.model';
import { LeaveRequest } from '../leave-requests/leave-request.model';
import { AuditService } from '../audit/audit.service';
import { sendSuccess } from '../../shared/response';
import { AuthenticatedRequest } from '../../middleware/auth';

export class SettingsController {
  public static async getDashboardStats(req: Request, res: Response, next: NextFunction) {
    try {
      const today = new Date().toISOString().split('T')[0];

      const [
        totalStudents,
        totalTeachers,
        totalClasses,
        todaySessions,
        pendingLeaves
      ] = await Promise.all([
        Student.countDocuments({ status: 'active' }),
        User.countDocuments({ role: 'teacher', isActive: true }),
        ClassModel.countDocuments({ status: 'active' }),
        AttendanceSession.find({ date: today }).lean(),
        LeaveRequest.countDocuments({ status: 'pending' })
      ]);

      const submittedSessionsCount = todaySessions.filter(s => s.status === 'submitted' || s.status === 'corrected').length;

      return sendSuccess(res, {
        totalStudents,
        totalTeachers,
        totalClasses,
        todayDate: today,
        todayTotalSessions: todaySessions.length,
        todaySubmittedSessions: submittedSessionsCount,
        pendingLeaves
      }, 'Admin dashboard metrics retrieved');
    } catch (error) {
      next(error);
    }
  }

  public static async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await AuditService.getLogs(req.query);
      return sendSuccess(res, data.logs, 'Audit logs retrieved', 200, {
        total: data.total,
        page: data.page,
        totalPages: data.totalPages
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getSettings(req: Request, res: Response, next: NextFunction) {
    try {
      let settings = await SchoolSettings.findOne();
      if (!settings) {
        settings = await SchoolSettings.create({});
      }
      return sendSuccess(res, settings, 'School settings retrieved');
    } catch (error) {
      next(error);
    }
  }

  public static async updateSettings(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      let settings = await SchoolSettings.findOne();
      if (!settings) {
        settings = await SchoolSettings.create({});
      }

      const before = settings.toObject();
      Object.assign(settings, req.body);
      await settings.save();

      await AuditService.log(
        req.user!._id.toString(),
        'SCHOOL_SETTINGS_UPDATED',
        'SchoolSettings',
        settings._id.toString(),
        before,
        settings.toObject()
      );

      return sendSuccess(res, settings, 'School settings updated successfully');
    } catch (error) {
      next(error);
    }
  }
}
