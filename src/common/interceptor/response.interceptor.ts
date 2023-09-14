// common/interceptor/response.interceptor.ts
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Response } from "express";
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<any> | Promise<Observable<any>> {
    // next.handle可以调用路由处理函数，pipe操作可以访问响应结果
    // map可以格式化响应结果
    // return 关键字可以将结果返回给客户端
    return next.handle().pipe(map(data => {
      const response = _context.switchToHttp().getResponse<Response>()
      response.status(200)
      return {
        data,
        code: 200,
        msg: 'ok'
      }
    }))
  }
}