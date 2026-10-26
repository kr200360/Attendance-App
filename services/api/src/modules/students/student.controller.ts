import { Request, Response, NextFunction } from 'express';
import { StudentService } from './student.service';
import { sendSuccess } from '../../shared/response';
import { AuthenticatedRequest } from '../../middleware/auth';

export class StudentController {
  public static async listStudents(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await StudentService.listStudents(req.query);
      return sendSuccess(res, data.students, 'Students retrieved successfully', 200, {
        total: data.total,
        page: data.page,
        totalPages: data.totalPages
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getStudentById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await StudentService.getStudentById(req.params.id);
      return sendSuccess(res, data, 'Student details retrieved');
    } catch (error) {
      next(error);
    }
  }

  public static async createStudent(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await StudentService.createStudent(req.body, req.user!._id.toString());
      return sendSuccess(res, data, 'Student created and enrolled successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  public static async updateStudent(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await StudentService.updateStudent(req.params.id, req.body, req.user!._id.toString());
      return sendSuccess(res, data, 'Student updated successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async linkParent(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await StudentService.linkParent(req.params.id, req.body, req.user!._id.toString());
      return sendSuccess(res, data, 'Parent linked successfully', 201);
    } catch (error) {
      next(error);
    }
  }
}
