import type { Request, Response, NextFunction } from 'express';
import type { Schema } from 'joi';

export function validateBody(schema: Schema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, { stripUnknown: true });
    if (error !== undefined) {
      res.status(400).json({
        message: 'Validation failed',
        details: error.details.map((d) => ({ path: d.path.join('.'), message: d.message })),
      });
      return;
    }
    req.body = value;
    next();
  };
}
