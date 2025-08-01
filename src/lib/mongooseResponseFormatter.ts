// utils/mongooseResponseFormatter.ts
import { Error as MongooseError } from 'mongoose';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Array<{
    field: string;
    message: string;
    code?: string;
  }>;
}


function formatMongooseError(error: any): Array<{ field: string; message: string; code?: string }> {
  // Validation Error
  if (error instanceof MongooseError.ValidationError) {
    return Object.keys(error.errors).map(key => ({
      field: key,
      message: error.errors[key].message,
      code: error.errors[key].kind
    }));
  }

  if (error instanceof MongooseError.CastError) {
    return [{
      field: error.path,
      message: `Invalid ${error.kind}: ${error.value}`,
      code: 'CastError'
    }];
  }

  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    return [{
      field,
      message: `${field} already exists`,
      code: 'DuplicateKey'
    }];
  }

  return [{
    field: 'general',
    message: error.message || 'An unknown error occurred',
    code: error.name || 'UnknownError'
  }];
}


export function createSuccessResponse<T>(data: T, message: string = 'Operation successful'): ApiResponse<T> {
  return {
    success: true,
    message,
    data
  };
}


export function createErrorResponse(error: any, message?: string): ApiResponse {
  const errors = formatMongooseError(error);
  
  return {
    success: false,
    message: message || (errors.length === 1 ? errors[0].message : 'Operation failed'),
    errors
  };
}