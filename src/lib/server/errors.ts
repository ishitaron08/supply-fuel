import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from './database';

export class ApiError extends Error {
  public statusCode: number;
  public errors?: any[];

  constructor(statusCode: number, message: string, errors?: any[]) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.name = 'ApiError';
  }
}

export function withErrorHandler(
  handler: (req: NextRequest, ctx?: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, ctx?: any) => {
    try {
      await connectDB();
      return await handler(req, ctx);
    } catch (error: any) {
      console.error('API Error:', error);

      if (error instanceof ApiError) {
        return NextResponse.json(
          {
            success: false,
            message: error.message,
            errors: error.errors,
          },
          { status: error.statusCode }
        );
      }

      // Mongoose ValidationError
      if (error.name === 'ValidationError') {
        return NextResponse.json(
          { success: false, message: error.message },
          { status: 400 }
        );
      }

      // Mongoose CastError
      if (error.name === 'CastError') {
        return NextResponse.json(
          { success: false, message: 'Invalid ID format.' },
          { status: 400 }
        );
      }

      // Mongoose duplicate key
      if (error.code === 11000) {
        return NextResponse.json(
          { success: false, message: 'Duplicate entry. Resource already exists.' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          message:
            process.env.NODE_ENV === 'development'
              ? error.message
              : 'Internal server error.',
        },
        { status: 500 }
      );
    }
  };
}
