import { ExceptionFilter, Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { format } from 'node:util'
@Catch()
export class InternalErrorFilter implements ExceptionFilter {
  logger: Logger
  constructor() {
    this.logger = new Logger()
  }
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>()
    const response = ctx.getResponse<Response>();
    response.status(500).json({
      code: 500,
      msg: 'Internal Server Error',
      timestamp: Date.now(),
      path: request.path,
      method: request.method
    });
  }
}