import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class InternalErrorFilter implements ExceptionFilter {
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