// utils/zodErrorFormatter.ts
import { ZodError } from 'zod';

export interface FormattedError {
  success: boolean;
  message: string;
  errors: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

export function formatZodError(error: ZodError): FormattedError {
  const errors = error.issues.map(err => ({
    field: err.path.length ? err.path.join('.') : 'root',
    message: err.message,
    code: err.code
  }));

  const message = errors.length === 1 
    ? `Validation error: ${errors[0].message}` 
    : `Validation failed with ${errors.length} errors`;

  return {
    success: false,
    message,
    errors
  };
}