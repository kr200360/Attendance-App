import { Response, NextFunction } from 'express';
import { NotificationService } from './notification.service';
import { sendSuccess } from '../../shared/response';
import { AuthenticatedRequest } from '../../middleware/auth';

export class NotificationController {
  public static async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await NotificationService.getUserNotifications(req.user!._id.toString());
      return sendSuccess(res, data, 'Notifications retrieved');
    } catch (error) {
      next(error);
    }
  }

  public static async markRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await NotificationService.markAsRead(req.params.id, req.user!._id.toString());
      return sendSuccess(res, data, 'Notification marked as read');
    } catch (error) {
      next(error);
    }
  }
}
