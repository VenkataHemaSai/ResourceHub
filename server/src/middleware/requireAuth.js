import { verifyToken } from '../utils/auth.js';
import { UnauthorizedError } from '../utils/errors.js';

export function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.token;

    if (!token) {
      throw new UnauthorizedError('Authentication required');
    }

    const payload = verifyToken(token);

    req.user = {
      userId: payload.userId,
      organizationId: payload.organizationId,
      role: payload.role,
    };

    next();
  } catch {
    next(new UnauthorizedError('Authentication required'));
  }
}
