import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User, IUserDocument } from '../users/user.model';
import { config } from '../../config/env';
import { UnauthorizedError, BadRequestError, NotFoundError } from '../../shared/errors';
import { LoginInput, RegisterInput } from '@school/validation';
import { AuditService } from '../audit/audit.service';

export class AuthService {
  public static generateTokens(user: IUserDocument) {
    const payload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role
    };

    const accessToken = jwt.sign(payload, config.jwt.accessSecret, {
      expiresIn: config.jwt.accessExpiresIn as any
    });

    const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn as any
    });

    return {
      accessToken,
      refreshToken,
      user: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        phone: user.phone,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString()
      }
    };
  }

  public static async login(input: LoginInput) {
    const user = await User.findOne({ email: input.email.toLowerCase() });
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Your account has been deactivated. Please contact an administrator.');
    }

    const isMatch = await user.comparePassword(input.password);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    await AuditService.log(user._id.toString(), 'AUTH_LOGIN', 'User', user._id.toString());
    return this.generateTokens(user);
  }

  public static async register(input: RegisterInput, actorId?: string) {
    const existing = await User.findOne({ email: input.email.toLowerCase() });
    if (existing) {
      throw new BadRequestError('A user with this email address already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(input.password, salt);

    const user = await User.create({
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash,
      role: input.role,
      phone: input.phone,
      isActive: true
    });

    if (actorId) {
      await AuditService.log(actorId, 'USER_CREATED', 'User', user._id.toString(), undefined, {
        email: user.email,
        role: user.role
      });
    }

    return this.generateTokens(user);
  }

  public static async refreshAccessToken(token: string) {
    try {
      const decoded: any = jwt.verify(token, config.jwt.refreshSecret);
      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive) {
        throw new UnauthorizedError('Invalid refresh token');
      }

      return this.generateTokens(user);
    } catch (err: any) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
  }

  public static async forgotPassword(email: string) {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Do not leak user existence
      return { message: 'If this email exists in our system, password reset instructions have been sent.' };
    }

    const resetToken = jwt.sign({ userId: user._id.toString() }, config.jwt.accessSecret, {
      expiresIn: '1h'
    });

    // In production, send via SMTP. For local/development, we output reset instructions.
    console.log(`[AUTH] Password reset requested for ${user.email}. Token: ${resetToken}`);

    return {
      message: 'If this email exists in our system, password reset instructions have been sent.',
      resetToken // included for development/testing convenience
    };
  }

  public static async resetPassword(token: string, newPassword: string) {
    try {
      const decoded: any = jwt.verify(token, config.jwt.accessSecret);
      const user = await User.findById(decoded.userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(newPassword, salt);
      await user.save();

      await AuditService.log(user._id.toString(), 'AUTH_PASSWORD_RESET', 'User', user._id.toString());
      return { message: 'Password has been reset successfully' };
    } catch (err: any) {
      throw new BadRequestError('Invalid or expired reset token');
    }
  }
}
