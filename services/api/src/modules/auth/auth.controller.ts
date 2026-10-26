import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { sendSuccess } from '../../shared/response';
import { AuthenticatedRequest } from '../../middleware/auth';

export class AuthController {
  public static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await AuthService.login(req.body);
      return sendSuccess(res, data, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  public static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await AuthService.refreshAccessToken(req.body.refreshToken);
      return sendSuccess(res, data, 'Token refreshed successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      // In stateless JWT, clients discard tokens. We provide an endpoint for cookie clearing/session audit
      return sendSuccess(res, { loggedOut: true }, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await AuthService.forgotPassword(req.body.email);
      return sendSuccess(res, data, data.message);
    } catch (error) {
      next(error);
    }
  }

  public static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await AuthService.resetPassword(req.body.token, req.body.newPassword);
      return sendSuccess(res, data, data.message);
    } catch (error) {
      next(error);
    }
  }

  public static async getMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      return sendSuccess(res, req.user, 'Current user profile retrieved');
    } catch (error) {
      next(error);
    }
  }
}
