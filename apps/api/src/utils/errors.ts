import { Response } from 'express';
import { Prisma } from '@prisma/client';

export class DomainError extends Error {
  public statusCode: number;
  public details?: any;

  constructor(message: string, statusCode: number = 500, details?: any) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class NotFoundError extends DomainError {
  constructor(message: string = 'Resource not found', details?: any) {
    super(message, 404, details);
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message: string = 'Unauthorized', details?: any) {
    super(message, 401, details);
  }
}

export class ForbiddenError extends DomainError {
  constructor(message: string = 'Forbidden', details?: any) {
    super(message, 403, details);
  }
}

export class ValidationError extends DomainError {
  constructor(message: string = 'Validation failed', details?: any) {
    super(message, 422, details);
  }
}

export class ConflictError extends DomainError {
  constructor(message: string = 'Resource conflict', details?: any) {
    super(message, 409, details);
  }
}

export class BadRequestError extends DomainError {
  constructor(message: string = 'Bad request', details?: any) {
    super(message, 400, details);
  }
}

export function handleDomainError(error: unknown, res: Response): void {
  if (error instanceof DomainError) {
    res.status(error.statusCode).json({ error: error.message, details: error.details });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      res.status(409).json({ error: 'Unique constraint failed', details: error.meta });
      return;
    }
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Record to update not found', details: error.meta });
      return;
    }
  }

  if (error instanceof Error) {
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
    return;
  }

  res.status(500).json({ error: 'Internal Server Error' });
}
