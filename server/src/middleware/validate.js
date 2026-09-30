import { ValidationError } from '../lib/errors.js';

export function validate(schema, target = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[target] || {});
    if (!result.success) {
      const fields = {};
      result.error.issues.forEach(i => {
        const key = i.path.join('.') || '_';
        fields[key] = i.message;
      });
      return next(new ValidationError(fields));
    }
    if (target === 'query') {
      Object.keys(req.query).forEach(k => delete req.query[k]);
      Object.assign(req.query, result.data);
    } else {
      req[target] = result.data;
    }
    next();
  };
}
