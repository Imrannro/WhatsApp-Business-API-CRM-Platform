import { Request, Response, NextFunction } from 'express';
import { authenticateRequest } from '../../../lib/auth';
import { User } from '../../../lib/db/types';

export interface AuthenticatedRequest extends Request {
  user?: Omit<User, 'passwordHash'>;
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  const cookieToken = req.cookies?.token;

  const user = await authenticateRequest(authHeader, cookieToken);
  if (!user) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized: Valid Bearer authentication token is required',
    });
    return;
  }

  req.user = user;
  next();
}
