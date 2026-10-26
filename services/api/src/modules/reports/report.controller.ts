import { Request, Response, NextFunction } from 'express';
import { ReportService } from './report.service';
import { sendSuccess } from '../../shared/response';

export class ReportController {
  public static async getDailyReport(req: Request, res: Response, next: NextFunction) {
    try {
      const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
      const data = await ReportService.getDailyReport(date);
      return sendSuccess(res, data, 'Daily report retrieved');
    } catch (error) {
      next(error);
    }
  }

  public static async getMonthlyReport(req: Request, res: Response, next: NextFunction) {
    try {
      const today = new Date();
      const year = Number(req.query.year) || today.getFullYear();
      const month = Number(req.query.month) || (today.getMonth() + 1);
      const classId = req.query.classId as string;

      const data = await ReportService.getMonthlyReport(year, month, classId);
      return sendSuccess(res, data, 'Monthly report retrieved');
    } catch (error) {
      next(error);
    }
  }

  public static async getBelowThreshold(req: Request, res: Response, next: NextFunction) {
    try {
      const threshold = req.query.threshold ? Number(req.query.threshold) : undefined;
      const data = await ReportService.getStudentsBelowThreshold(threshold);
      return sendSuccess(res, data, 'Students below threshold retrieved');
    } catch (error) {
      next(error);
    }
  }

  public static async exportCsv(req: Request, res: Response, next: NextFunction) {
    try {
      const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
      const csv = await ReportService.exportAttendanceCsv(date);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="attendance-report-${date}.csv"`);
      return res.status(200).send(csv);
    } catch (error) {
      next(error);
    }
  }
}
