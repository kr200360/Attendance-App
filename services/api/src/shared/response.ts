import { Response } from 'express';

export function sendSuccess<T>(res: Response, data: T, message?: string, statusCode: number = 200, meta?: any) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    meta
  });
}

export function sendError(res: Response, message: string, statusCode: number = 500, code?: string, errors?: any[]) {
  return res.status(statusCode).json({
    success: false,
    message,
    code,
    errors
  });
}
