import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { STATUS_CODES } from 'node:http';

export interface ErrorBody {
  statusCode: number;
  error: string;
  message: string | string[];
  path: string;
  timestamp: string;
}

/** Formato único de error. Los 5xx no exponen detalles internos. */
@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpErrorFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const status = statusOf(exception);
    if (status >= 500) {
      this.logger.error(
        exception instanceof Error ? exception.stack : 'Error no identificado',
      );
    }
    const body: ErrorBody = {
      statusCode: status,
      error: STATUS_CODES[status] ?? 'Error',
      message: messageOf(exception, status),
      path: http.getRequest<Request>().path,
      timestamp: new Date().toISOString(),
    };
    http.getResponse<Response>().status(status).json(body);
  }
}

function statusOf(exception: unknown): number {
  if (exception instanceof HttpException) return exception.getStatus();
  // Errores del parser de Express (JSON mal formado, cuerpo demasiado grande).
  const status = (exception as { status?: unknown } | null)?.status;
  return typeof status === 'number' && status >= 400 && status < 500
    ? status
    : 500;
}

function messageOf(exception: unknown, status: number): string | string[] {
  const fallback = STATUS_CODES[status] ?? 'Error';
  if (status >= 500 || !(exception instanceof HttpException)) return fallback;
  const response = exception.getResponse();
  if (typeof response === 'string') return response;
  return (response as { message?: string | string[] }).message ?? fallback;
}
