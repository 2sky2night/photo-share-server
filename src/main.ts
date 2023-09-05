import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { PORT } from './config'
import { AppLogger, ResponseInterceptor } from './common/interceptor'
import { HttpExceptionFilter, InternalErrorFilter } from './common/filter'

async function appStart() {
  const app = await NestFactory.create(AppModule)
  // 注册捕获全部错误过滤器
  app.useGlobalFilters(new InternalErrorFilter())
  // 注册http请求错误过滤器
  app.useGlobalFilters(new HttpExceptionFilter())
  // 注册响应拦截器
  app.useGlobalInterceptors(new ResponseInterceptor())
  // 注册打印拦截器
  app.useGlobalInterceptors(new AppLogger())
  // api根路径
  app.setGlobalPrefix('/api')
  app.listen(PORT, () => console.log(`http://127.0.0.1:${PORT}`))
}
appStart()
