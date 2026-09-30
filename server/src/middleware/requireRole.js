import { ForbiddenError } from '../utils/errors.js';

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    // req.user is guaranteed to exist because this must run after requireAuth
    if (!req.user) {
      return next(new ForbiddenError('User not authenticated'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError('You do not have permission to perform this action'));
    }

    next();
  };
}
