import { ValidationError } from '../lib/errors.js';

export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const fields = {};
      result.error.issues.forEach(i => {
        const key = i.path.join('.') || '_';
        fields[key] = i.message;
      });
      return next(new ValidationError(fields));
    }
    req.body = result.data;
    next();
  };
}
