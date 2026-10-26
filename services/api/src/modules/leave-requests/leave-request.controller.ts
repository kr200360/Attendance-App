import { Response, NextFunction } from 'express';
import { LeaveRequestService } from './leave-request.service';
import { sendSuccess } from '../../shared/response';
import { AuthenticatedRequest } from '../../middleware/auth';

export class LeaveRequestController {
  public static async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await LeaveRequestService.createLeaveRequest(req.body, req.user!._id.toString());
      return sendSuccess(res, data, 'Leave request submitted successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  public static async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await LeaveRequestService.listLeaveRequests(req.user);
      return sendSuccess(res, data, 'Leave requests retrieved');
    } catch (error) {
      next(error);
    }
  }

  public static async review(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await LeaveRequestService.reviewLeaveRequest(
        req.params.id,
        req.body,
        req.user!._id.toString()
      );
      return sendSuccess(res, data, `Leave request ${req.body.status}`);
    } catch (error) {
      next(error);
    }
  }
}
