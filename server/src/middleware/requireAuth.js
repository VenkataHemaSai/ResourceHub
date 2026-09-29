import { verifyToken } from '../lib/auth.js';
import { UnauthorizedError } from '../lib/errors.js';

export function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.token;
    
    if (!token) {
      throw new UnauthorizedError('Authentication required');
    }

    const payload = verifyToken(token);
    
    // Attach to request
    req.user = {
      userId: payload.userId,
      organizationId: payload.organizationId,
      role: payload.role,
    };
    
    next();
  } catch (err) {
    next(new UnauthorizedError('Authentication required'));
  }
}
