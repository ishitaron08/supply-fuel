import { ZodSchema } from 'zod';
import { ApiError } from './errors';

export function validateRequest(
  schema: ZodSchema,
  data: { body?: any; query?: any; params?: any }
) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors = result.error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    throw new ApiError(400, 'Validation failed', errors);
  }
}
