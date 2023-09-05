// common/filter/http-exception.filter.ts
import { Catch, HttpException, ExceptionFilter, ArgumentsHost } from "@nestjs/common";
import { Response, Request } from 'express'
// 捕获http错误 400--5xx
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const requst = ctx.getRequest<Request>()
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const message = exception.message;

    response.status(status).json({
      code: status,
      msg: message,
      timestamp: Date.now(),
      path: requst.path,
      method: requst.method
    });
  }
}