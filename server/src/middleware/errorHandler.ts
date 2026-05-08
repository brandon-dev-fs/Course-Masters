import { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from '../errors/index.js';
import { logger } from '../lib/logger.js';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2025') {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Resource not found' } });
      return;
    }
    if (err.code === 'P2002') {
      res.status(409).json({ error: { code: 'CONFLICT', message: 'Resource already exists' } });
      return;
    }
    if (err.code === 'P2003') {
      res.status(409).json({ error: { code: 'CONFLICT', message: 'Operation conflicts with an existing relation' } });
      return;
    }
    if (err.code === 'P2014') {
      res.status(409).json({ error: { code: 'CONFLICT', message: 'Operation would violate a required relation' } });
      return;
    }
    if (err.code === 'P2034') {
      res.status(409).json({ error: { code: 'TRANSACTION_CONFLICT', message: 'Concurrent modification detected; please retry.' } });
      return;
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid request data' } });
    return;
  }

  logger.error({ err }, 'Unhandled error');
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } });
}
