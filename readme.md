照片墙小项目

## 功能描述

​	浏览分享照片的网站，用户可以分享、点赞、浏览照片。照片需要审核才可以被发布，管理员可以审核照片、超级管理员可以审核和管理所有账号。所有角色都可以修改自己的基本信息。角色有：用户User、管理员Admin、超级管理员SuperAdmin。

用户：只能进入前台页面，查看、点赞、分享照片，修改自己的基本资料，查看自己分享的照片（包括审核、未审核的照片），用户点击详情照片后需要上报信息。

管理员：只能进入后台页面，审核照片列表，查看已经审核的照片列表（只能查看自己审核的照片），修改自己的基本信息。

超级管理员：只能进入后台页面，审核照片列表，查看所有已经审核通过的照片列表，修改所有账户的基本信息，下发管理员账户。

## 实体

用户(uid、username、password、avatar、role)、照片(pid、title、content、photos)。

### 联系

照片实体（添加外键，publish_uid）：一个用户可以发布多个照片，一个照片只能对应一个发布者（用户--（发布）--照片）1对多

照片实体(添加外键，audit_uid,添加审核时间:audit_time,添加审核描述:audit_desc，审核状态:status)一个管理员可以审核多个照片，一个照片只能被一个管理员审核 （用户--（审核）-照片-）1对多

用户点赞照片(添加联系表，uid、pid):一个用户可以点赞多个照片，一个照片也能被多个用户点赞 （用户--（点赞）--照片）多对多

用户评论照片(添加评论表，uid、content、pid)，一个用户可以评论多个照片，一个照片也能被多个用户评论 (用户--（评论）--照片)

### 模型

user:uid、username、password、avatar、role

photo:pid、title、content、photos、publish_uid、audit_uid、audit_time、audit_desc

userLikePhoto:pid、uid

userCommentPhoto:pid、uid、content

## 服务

我们使用的技术栈：

Nest.js：提供Http接口

sequelize-typescript：操作DB

Mysql2：数据库驱动

### 一、环境搭建

#### 1.热重载、ts编译器

##### 安装依赖

```shell
pnpm add typescript、ts-node、nodemon -D
```

##### 配置ts编译器

初始化编译器，并且由于要使用装饰器，所以要修改ts配置项。要是报错tsc不是命令则需要全局安装typescript。

```shell
tsc --init
```

```json
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,    
```

ts2564错误：声明的属性未在构造函数中初始化？解决，在ts.config.json中配置

```json
  "strictPropertyInitialization": false
```



##### 配置热重载

​	nodemon监听src文件夹，src文件夹内部文件有改动就执行 ts-node src/main.ts

```json
{
  "scripts": {
    "start:dev": "nodemon --watch src --exec ts-node src/main.ts",
  },
}
```

#### 2.Nest.js初始化

##### 	Nest.js开发必要的包

```shell
pnpm add @nestjs/core @nestjs/common 
```

##### 	Nest.js的平台，Nest的基础服务我选择express

```shell
pnpm add @nestjs/platform-express express
pnpm add @types/express -D
```

##### 	启动Nest应用

​	创建根模块以及配置相关设置，启动应用。

```ts
// 根模块
import {Module} from '@nestjs/common'

@Module({
  controllers: [],
  providers:[]
})
export class AppModule { }
```



```ts
// main.ts
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { PORT } from './config'

async function appStart() {
  const app = await NestFactory.create(AppModule)
  app.listen(PORT, () => console.log(`http://127.0.0.1:${PORT}`))
}
appStart()
```

#### 3.Sequelize初始化

##### 1.安装依赖

sequelize作为操作DB的框架，Mysql2作为连接DB的驱动器

```shell
 pnpm add @nestjs/sequelize sequelize sequelize-typescript mysql2
```

还需要安装对sequelize的类型支持

```shell
pnpm add @types/sequelize -D
```

##### 2.连接数据库，并sequelize实例封装成Nest的提供者

连接数据库配置项

```ts
import { SequelizeOptions } from "sequelize-typescript";

/**
 * 数据库连接配置项
 */
export const databaseConfig: SequelizeOptions = {
  dialect: 'mysql',
  host: 'localhost',
  database: '*****',
  username: 'root',
  password: '****',
  port: 3306
}

```

封装提供者

```ts
import { Provider } from "@nestjs/common";
import { databaseConfig } from "../config";
import { Sequelize } from "sequelize-typescript";

export const databaseProvider: Provider[] = [
  {
    provide: 'DATABASE',
    async useFactory() {
      const sequelize = new Sequelize(databaseConfig)
      // 添加模型
      sequelize.addModels([])
      // 根据模型创建表
      await sequelize.sync()
      return sequelize
    },
  }
]
```

##### 3.将数据库封装模块，并导出数据

​	通过Module装饰器修饰DatabaseModule，把他当作一个模块，通过provider将sequelize作为模块的提供者，通过export将sequelize暴露出去，这样其他模块可以通过import导入就可以使用sequelize了。

```ts
import { Module } from "@nestjs/common";
import { databaseProvider } from "./database.provider";

@Module({
  providers: [...databaseProvider],
  exports: [...databaseProvider],
})
export class DatabaseModule { }
```

##### 4.在App根模块中导入数据库模块

这样整个Nest应用都被注入了sequelize实例了。

```ts
import {Module} from '@nestjs/common'
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    DatabaseModule
  ],
  controllers: [],
  providers:[]
})
export class AppModule { }
```

### 二、中间件

#### 1.统一的响应风格

​	使用拦截器实现统一的响应风格，拦截器可以控制处理函数的执行且可以调用处理函数，并获得处理函数的结果，还可以二次加工结果，将加工后的结果响应给客户端。

##### 定义拦截器

```ts
// common/interceptor/response.interceptor.ts
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<any> | Promise<Observable<any>> {
    // next.handle可以调用路由处理函数，pipe操作可以访问响应结果
    // map可以格式化响应结果
    // return 关键字可以将结果返回给客户端
    return next.handle().pipe(map(data => {
      return {
        data,
        code: 200,
        msg: 'ok'
      }
    }))
  }
}
```

##### 注册全局响应拦截器

```ts
  app.useGlobalInterceptors(new ResponseInterceptor())
```

#### 2.统一的业务错误响应

使用Nest提供的过滤器可以过滤http（业务）请求失败，从而响应统一格式的错误信息。

##### 定义

```ts
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
```

##### 注册http错误过滤器

```ts
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { PORT } from './config'
import { ResponseInterceptor } from './common/interceptor'
import { HttpExceptionFilter } from './common/filter'

async function appStart() {
  const app = await NestFactory.create(AppModule)
  // 注册http请求错误过滤器
  app.useGlobalFilters(new HttpExceptionFilter())
  // 注册响应拦截器
  app.useGlobalInterceptors(new ResponseInterceptor())
  app.listen(PORT, () => console.log(`http://127.0.0.1:${PORT}`))
}
appStart()
```

#### 3.统一的内部错误响应

有时候语法出错或编译器出错或内部库出错，给客户端友好的响应服务器出错的信息。我们这里使用过滤器

##### 定义

```ts
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
```

##### 注册

```ts
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { PORT } from './config'
import { ResponseInterceptor } from './common/interceptor'
import { HttpExceptionFilter, InternalErrorFilter } from './common/filter'

async function appStart() {
  const app = await NestFactory.create(AppModule)
  // 注册捕获全部错误过滤器，一定要在http请求错误过滤器的上面，不然http错误响应会被覆盖掉
  app.useGlobalFilters(new InternalErrorFilter())
  // 注册http请求错误过滤器
  app.useGlobalFilters(new HttpExceptionFilter())
  // 注册响应拦截器
  app.useGlobalInterceptors(new ResponseInterceptor())
  app.listen(PORT, () => console.log(`http://127.0.0.1:${PORT}`))
}
appStart()

```



#### 4.打印请求日志

​	拦截器可以在调用处理函数前后可以做一些事情，我们可以在客户端请求接口时会打印请求接口的状态，在接口出现内容错误时也能及时定位到错误的路由处理函数。

##### 定义

```ts
import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable, catchError, throwError } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';
import { format } from 'util';

@Injectable()
export class AppLogger implements NestInterceptor {
  private readonly logger = new Logger(); // 实例化日志记录器

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const start = Date.now(); // 请求开始时间
    // 调用完handle()后得到RxJs响应对象，使用tap可以得到路由函数的返回值
    const host = context.switchToHttp();
    const request = host.getRequest<Request>();

    return next.handle().pipe(
      // 捕获错误
      catchError((error) => {
        this.logger.error(format(
          '%s %s %dms %s',
          request.method,
          request.url,
          Date.now() - start,
          error
        ));
        return throwError(error)
      }),
      // 成功
      tap(
        (response) => {
          // 打印请求方法，请求链接，处理时间和响应数据
          this.logger.log(format(
            '%s %s %dms %s',
            request.method,
            request.url,
            Date.now() - start,
            JSON.stringify(response),
          ));
        })
    );
  }
}

```

##### 注册

```ts
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

```

#### 5.管道

​	通过编写自定义管道，可以在校验参数失败时，定义响应错误的原因，Nest内置的ValidationPipe不能响应自定义的内容。

```ts
import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      // 如果没有传入验证规则，则不验证，直接返回数据
      return value;
    }
    // object为传入的表单值（请求体或装饰的目标参数）
    const object = plainToInstance(metatype, value);
    // 通过值去校验表单
    const errors = await validate(object);

    // 出现错误了
    if (errors.length > 0) {
      if (errors[0].constraints) {
        // 获取校验失败的原因
        const tips = Object.values(errors[0].constraints)[0]
        throw new BadRequestException(`表单校验失败:${tips}`);
      } else {
        throw new BadRequestException('表单校验失败!')
      }
    }
    return value;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}

```

#### 6.解析token的中间件

若用户请求头部authorization携带了token就解析并保存在上下文中

```ts
import { NestMiddleware, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request, Response } from "express";
import { JWT_SECRET } from "../../config";

export class TokenParseMiddleware implements NestMiddleware {
  jwtService: JwtService
  constructor() {
    this.jwtService = new JwtService()
  }
  async use(req: Request, _res: Response, next: (error?: any) => void) {
    const token = this.getToken(req)
    if (token) {
      // 有token，需要校验token
      try {
        const playload = await this.jwtService.verifyAsync(token, { secret: JWT_SECRET })
        // @ts-ignore 将解析出来的数据保存到上下文中
        req.user = playload
        next()
      } catch (error) {
        throw new UnauthorizedException()
      }
    } else {
      next()
    }
  }
  getToken(req: Request) {
    const authorization = req.headers.authorization
    if (authorization === undefined) {
      // 未携带token
      return undefined
    } else {
      const [type, token] = authorization.split(' ')
      if (type === 'Bearer') {
        return token
      } else {
        // 非jwt类型的token或其他字符串
        throw new UnauthorizedException()
      }
    }
  }
}
```

#### 7.解析保存上下文中的token用户数据

​	使用参数装饰器并修饰在控制层处理函数中可以很方便的数据注入到处理函数中。对于我们把token数据保存在请求上下文中需要我们手动`req.user`获取数据，有点麻烦。可以封装一个装饰器来快捷的获取到上下文中的指定内容。

##### 简单示例：

​	返回的内容会直接注入到对应修饰的参数中

```ts
import { createParamDecorator } from "@nestjs/common";
import { ExecutionContextHost } from "@nestjs/core/helpers/execution-context-host";

export const Token = createParamDecorator((data, input: ExecutionContextHost) => {
  return '123'
})
```

```ts
  @UseGuards(AuthGuard)
  @Get('token')
  token(@Req() req: Request,@Token() token:TokenData) {
    console.log(token); // 123
    
    // @ts-ignore
    return req.user
  }
```

##### 进阶

```ts
import { BadGatewayException, createParamDecorator } from "@nestjs/common";
import { ExecutionContextHost } from "@nestjs/core/helpers/execution-context-host";
import { Request } from "express";
import { TokenData } from "../../types/token";

export const Token = createParamDecorator((data: "sub" | "iat" | "exp" | undefined, input: ExecutionContextHost) => {
  // data为装饰器调用时传入的参数，这里我们可以通过他结构出token中的某个属性
  const request = input.switchToHttp().getRequest<Request>()
  // @ts-ignore
  const tokenData: TokenData = request.user
  // 若中间件解析了token并保存在上下文中
  if (tokenData) {
    if (data === undefined) {
      // 不解构属性
      return tokenData
    } else {
      // 解构属性
      if (Object.keys(tokenData).includes(data)) {
        return tokenData[data]
      } else {
        throw new BadGatewayException(`token中无该属性:${data}`)
      }
    }
  } else {
    throw new BadGatewayException('上下文中无解析的token数据!')
  }
})
```

使用

```ts
  @UseGuards(AuthGuard)
  @Get('token')
  token(@Req() req: Request,@Token() token:TokenData) {
    console.log(token);
    
    // @ts-ignore
    return req.user
  }
或
  @UseGuards(AuthGuard)
  @Get('token')
  token(@Req() req: Request,@Token('sub') uid:number) {
    console.log(token);
    
    // @ts-ignore
    return req.user
  }
```



#### 8.鉴权路由守卫

​	通过路由守卫，可以很好的限制哪些用户可以访问该接口。由于守卫也属于中间件的一种，我们也可以通过他来访问上下文，并把解析出来的数据保存在上下文中，方便路由处理函数获取token数据。

##### 定义路由守卫

```ts
import { CanActivate, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { Request } from "express";
import { JwtService } from "@nestjs/jwt";
import { JWT_SECRET } from "../../config";
import { TokenData } from "../../types/token";
import { User } from "../../modules/user/model/user.model";

export class AuthGuard implements CanActivate {
  private jwtService: JwtService
  private userModel: typeof User
  constructor() {
    this.jwtService = new JwtService()
    this.userModel = User
  }
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>()
    const token = this.getToken(request)
    // 解析token
    try {
      const playload = await this.jwtService.verifyAsync<TokenData>(token, { secret: JWT_SECRET })
      // 查询此用户id的用户是否存在
      await this.findUser(playload.sub)
      // @ts-ignore
      request.user = playload
      return true
    } catch (error) {
      console.log(error);
      throw new UnauthorizedException('token不合法!')
    }
  }
  // 查询用户是否存在
  async findUser(uid: number) {
    const user = await this.userModel.findByPk(uid)
    if (user === null) {
      throw new UnauthorizedException('用户id不合法!')
    }
  }
  // 从请求头部获取token
  getToken(req: Request) {
    const authorization = req.headers.authorization
    if (authorization === undefined) {
      // 未携带token
      throw new UnauthorizedException('未携带token!')
    } else {
      const [type, token] = authorization.split(' ')
      if (type === 'Bearer') {
        return token
      } else {
        // 非jwt类型的token或其他字符串
        throw new UnauthorizedException('token不合法!')
      }
    }
  }
}
```

##### 参数装饰器解析token

​	将token数据保存在上下文时，在路由处理函数我们需要使用@Req装饰器来获取request，再链式访问才能获取到解析出来的token数据，会比较麻烦，我们可以封装一个参数装饰器，来快速获取上下文中的token

```ts
import { BadGatewayException, createParamDecorator } from "@nestjs/common";
import { ExecutionContextHost } from "@nestjs/core/helpers/execution-context-host";
import { Request } from "express";
import { TokenData } from "../../types/token";

export const Token = createParamDecorator((data: "sub" | "iat" | "exp" | undefined, input: ExecutionContextHost) => {
  // data为装饰器调用时传入的参数，这里我们可以通过他结构出token中的某个属性
  const request = input.switchToHttp().getRequest<Request>()
  // @ts-ignore
  const tokenData: TokenData = request.user
  // 若中间件解析了token并保存在上下文中
  if (tokenData) {
    if (data === undefined) {
      // 不解析属性
      return tokenData
    } else {
      if (Object.keys(tokenData).includes(data)) {
        return tokenData[data]
      } else {
        throw new BadGatewayException(`token中无该属性:${data}`)
      }
    }
  } else {
    throw new BadGatewayException('上下文中无解析的token数据!')
  }
})
```

使用

```ts
  @UseGuards(AuthGuard)
  @Put('password')
  // 修改用户自己的密码
  async updatePassword(@Token('sub') uid: number, @Body(new ValidationPipe()) userUpdatePasswordDto: UserUpdatePasswordDto) {
    await this.userService.updateUserPassword(uid, userUpdatePasswordDto.password)
    return '更新用户密码成功!'
  }
```



#### 9.角色守卫

​	角色守卫会在执行路由处理函数前，根据当token中的uid来检查用户拥有的角色，若用户的角色满足该路由的访问权限就可以调用该接口。

##### 路由元数据

​	我们需要使用自定义方法装饰器给路由处理函数挂载元数据，给路由处理函数设置哪些角色可以访问该路由的信息。这样我们的角色守卫就可以获取路由处理函数的元数据从而知晓该路由处理函数所需要的权限。

```ts
// role.decorator.ts
import { SetMetadata } from "@nestjs/common";
import { Role as RoleType } from "../../modules/auth/role";

export const Role = (...roles: RoleType[]) => {
  return SetMetadata('roles', roles)
}
```

##### 定义角色守卫

```ts
import { BadGatewayException, CanActivate, ExecutionContext, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Role } from "../../modules/auth/role";
import { Request } from "express";
import { TokenData } from "../../types/token";
import { User } from "../../modules/user/model/user.model";

@Injectable()
export class RoleGuard implements CanActivate {
  private userModel: typeof User
  constructor(private reflector: Reflector) {
    this.userModel = User
  }
  // 获取用户的id，通过用户id来查询用户的角色，再通过角色和路由处理函数所需的角色来判断用户是否有权限放行守卫
  async canActivate(context: ExecutionContext): Promise<boolean> {
     // 通过reflector可以获取到路由处理函数保存的元数据(SetMetData)
    const roles = this.reflector.get<Role[]>('roles', context.getHandler())
    const request = context.switchToHttp().getRequest<Request>()
    // @ts-ignore
    const playload = request.user as TokenData
    if (playload === undefined) {
      // 若无中间件解析token数据
      throw new BadGatewayException('请求上下文中无解析的token数据!')
    } else {
      // 查询用户角色
      const user = await this.userModel.findByPk(playload.sub)
      if (user === null) {
        // 用户表不存在该id
        throw new NotFoundException('此用户id不存在!')
      }
      if (roles.includes(user.role)) {
        return true
      } else {
        throw new ForbiddenException('无权限访问!')
      }
    }
  }
} 
```

##### 使用

注意方法装饰器的执行顺序，Role设置路由元数据的顺序需要早于守卫的

```ts
  @Role(Roles.SuperAdmin)
  @UseGuards(AuthGuard, RoleGuard)
  @Put('update/:uid')
  // 超级管理员更新用户信息
  async updateUser(@Param('uid', ParseIntPipe) uid: number, @Body(new ValidationPipe()) authUpdateDto: AuthUpdateDto) {
    await this.authService.updateUser(uid, authUpdateDto)
    return '更新用户信息成功!'
  }
```





### 三、auth模块

​	auth模块主要是做登录、注册和一些需要角色权限的操作。auth模块需要导入user模块，就能直接注册user模块所有内容了（路由也能注册）。

接口：登录、注册、修改用户信息

#### 1.服务层

##### 登录



##### 注册



##### 修改指定用户的全部信息



```ts
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { UserService } from "../user/user.service";
import { AuthRegisterDto } from "./dto/auth-register.dto";
import { Roles } from "./role";
import { AuthLoginDto } from "./dto/auth-login.dto";
import { decrpty } from "../../common/crypto";
import { PASSWORD_SECRET } from "../../config";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class AuthService {
  constructor(
    // 注入用户服务层 不需要使用Inject来注入，因为UserService会自动注册？
    private userService: UserService,
    // 注入jwt
    private jwtService: JwtService
  ) { }
  /**
   * 注册
   */
  register(authRegisterDto: AuthRegisterDto) {
    return this.userService.createUser(authRegisterDto, Roles.User)
  }
  /**
   * 登录
   */
  async login({ username, password }: AuthLoginDto) {
    // 查询用户名称是否存在
    const user = await this.userService.findUserByusername(username)
    if (user === null) {
      // 用户不存在
      throw new NotFoundException('用户名不存在!')
    }
    // 密码是否匹配
    const _dePassword = decrpty(user.password, PASSWORD_SECRET)
    if (_dePassword === password) {
      // 下发token
      return {
        access_token: await this.jwtService.signAsync({
          sub: user.uid,
        })
      }
    } else {
      throw new BadRequestException('用户名或密码错误!')
    }
  }
}
```

#### 2.控制层

##### 登录

​	通过管道来校验请求体数据，进入服务层，查询用户名是否存在，存在就将加密的密码解密，再判断是否和传入的请求体中的password是否一致，一致就登录成功，下发token。

```ts
  /**
   * 登录service
   */
  async login({ username, password }: AuthLoginDto) {
    // 查询用户名称是否存在
    const user = await this.userService.findUserByusername(username)
    if (user === null) {
      // 用户不存在
      throw new NotFoundException('用户名不存在!')
    }
    // 密码是否匹配
    const _dePassword = decrpty(user.password, PASSWORD_SECRET)
    if (_dePassword === password) {
      // 下发token
      return {
        access_token: await this.jwtService.signAsync({
          sub: user.uid,
        })
      }
    } else {
      throw new BadRequestException('用户名或密码错误!')
    }
  }
```

##### 注册

​	注册先通过中间件管道解析和校验请求体数据，成功就进入服务层，查询用户名是否已经存在了，未存在就创建一个角色为user的用户，密码使用aes对称加密。

```ts
  /**
   * 注册service
   */
  register(authRegisterDto: AuthRegisterDto) {
    return this.userService.createUser(authRegisterDto, Roles.User)
  }
```

##### 修改指定用户信息

​	超级管理员可以随意修改所有用户的数据，注意修改密码时需要加密密码再保存到数据库中。

```ts
  /**
   * 更新指定的用户信息service
   */
  async updateUser(uid: number, { username, password, avatar }: AuthUpdateDto) {
    // 更新用户基本信息
    await this.userService.updateUser(uid, { username, avatar })
    // 更新用户密码
    await this.userService.updateUserPassword(uid, password)
    return true
  }
```

##### 源代码

```ts
import { Body, Controller, Get, Put, Param, ParseIntPipe, Post, Req, UseGuards } from "@nestjs/common";
import { ValidationPipe } from "../../common/pipe";
import { AuthRegisterDto } from "./dto/auth-register.dto";
import { AuthService } from "./auth.service";
import { AuthLoginDto } from "./dto/auth-login.dto";
import { Request } from "express";
import { AuthGuard, RoleGuard } from "../../common/guard";
import { Token } from "../../common/decorator";
import { TokenData } from "../../types/token";
import { AuthUpdateDto } from "./dto/auth-update.dto";
import { Role } from "../../common/decorator/role.decorator";
import { Roles } from "./role";

@Controller('auth')
export class AuthController {
  constructor(
    // 注入auth服务层 不需要使用Inject来注入，因为AuthService在模块中已经作为提供者了
    private authService: AuthService
  ) { }

  @Post('register')
  async register(@Body(new ValidationPipe()) authRegisterDto: AuthRegisterDto) {
    return await this.authService.register(authRegisterDto)
  }
  @Post('login')
  async login(@Body(new ValidationPipe()) authLoginDto: AuthLoginDto) {
    return await this.authService.login(authLoginDto)
  }
  @Role(Roles.SuperAdmin)
  @UseGuards(AuthGuard, RoleGuard)
  @Put('update/:uid')
  // 超级管理员更新用户信息
  async updateUser(@Param('uid', ParseIntPipe) uid: number, @Body(new ValidationPipe()) authUpdateDto: AuthUpdateDto) {
    await this.authService.updateUser(uid, authUpdateDto)
    return '更新用户信息成功!'
  }
  @UseGuards(AuthGuard)
  @Get('token')
  token(@Req() req: Request, @Token() token: TokenData) {
    // @ts-ignore
    return req.user
  }
}
```



#### 3.模块

```ts
import { MiddlewareConsumer, Module, NestModule, RequestMethod } from "@nestjs/common";
import { UserModule } from "../user/user.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtModule } from '@nestjs/jwt'
import { JWT_SECRET } from "../../config";
import { TokenParseMiddleware } from "../../common/middleware";

@Module({
  imports: [
    UserModule,
    JwtModule.register({
      secret: JWT_SECRET,
      signOptions: {
        expiresIn: '24h'
      }
    })
  ],
  controllers: [
    AuthController
  ],
  providers: [
    AuthService
  ]
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(
      TokenParseMiddleware
    ).forRoutes(
      {
        path: '/auth/token',
        method:RequestMethod.GET
      }
    )
  }
}
```



### 四、User模块

​	user模块主要负责对user的增删改查。

提供的服务：增加用户、修改用户基本信息、修改用户密码

提供的接口：修改用户基本信息、修改用户密码

#### 1.模型

##### 1.创建user模型

```ts
import { Table, Model, Column, PrimaryKey, Comment, DataType, AutoIncrement, Length, Default } from "sequelize-typescript";
import { Role, Roles, roles } from "../../auth/role";
@Table({
  tableName: 'user'
})
export class User extends Model<User>{

  @Comment('账户id')
  @PrimaryKey
  @AutoIncrement
  @Column
  uid?: number;

  @Comment('账户名称')
  @Column(DataType.STRING)
  username?: string;

  @Comment('账户密码')
  @Column(DataType.STRING)
  passowrod?: string;

  @Length({ max: 512 })
  @Comment('账户头像')
  @Column(DataType.STRING)
  avatar?: string;

  @Comment('用户角色')
  @Column(DataType.ENUM(...roles))
  // @Default(Roles.User)
  role?: Role
}
```

**创建好了模型记得在数据库模块提供者中添加模型**

```ts
import { Provider } from "@nestjs/common";
import { databaseConfig } from "../config";
import { Sequelize } from "sequelize-typescript";
import { User } from "../modules/user/model/user.model";

export const databaseProvider: Provider[] = [
  {
    provide: 'DATABASE',
    async useFactory() {
      const sequelize = new Sequelize(databaseConfig)
      // 添加模型
      sequelize.addModels([
        User
      ])
      // 根据模型创建表
      await sequelize.sync()
      return sequelize
    },
  }
]
```



#### 2.user模块的提供者

​	user模块的提供者主要是为了提供操作DB的模型

```ts
import { Provider } from "@nestjs/common"
import { User } from "./model/user.model"

export const userProvider: Provider[] = [
  {
    provide: 'UserModel',
    useValue:User
  }
]
```

将user提供者注入到user模块中并暴露user提供者，让外部模块导入使用

```ts
import { Module } from "@nestjs/common";
import { userProvider } from "./user.provider";

@Module({
  controllers:[],
  // 注入
  providers: [
    ...userProvider
  ],
  // 导出user提供者
  exports: [
    ...userProvider
  ]
})
export class UserModule { }

```

#### 3.控制层

​	user控制层主要负责用户信息查询、修改等功能。

##### 修改用户个人信息

​	该接口场景：用户登录后修改自己的个人信息（用户名和头像）,通过管道校验数据后，调用service层。

##### 修改用户密码

​	该接口场景：用户修改自己的密码，通过管道校验数据后，进入service层。

##### 获取用户基本信息

​	该接口场景：用户登录后，查看该用户的基本信息，通过管道校验后，进入service层。

#### 4.服务层

​	user服务层主要负责用户的增删改查。由于auth模块需要使用user服务层来操作User模型，所以需要exports用户服务层。

##### 查询用户名称

​	根据用户名称查询用户

##### 查询用户id

​	根据主键查询用户

##### 修改用户信息

​	修改用户的基本信息

##### 修改用户密码

​	修改用户密码，注意密码需要加密后保存到数据库

##### 创建用户

​	创建用户，需要检查用户名是否重复，还要注意密码需要加密后保存到数据库。

##### 查看用户基本信息

​	通过数据库查询到该用户后，返回用数据。

##### 源代码

```ts
import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { User } from "./model/user.model";
import { encrpty } from "../../common/crypto";
import { PASSWORD_SECRET } from "../../config";
import { Role } from "../auth/role";
import { UserCreateDto } from "./dto/user-create.dto";
import { UserUpdateDto } from "./dto/user-update.dto";
import { Op } from "sequelize";

@Injectable()
export class UserService {
  constructor(
    // 注入user模型
    @Inject('UserModel') private userModel: typeof User
  ) { }
  /**
   * 创建用户
   * @param authRegisterDto 创建用户的数据
   */
  async createUser({ username, password }: UserCreateDto, role: Role) {
    // 查询用户名是否重复
    const user = await this.findUserByusername(username)
    if (user !== null) {
      // 用户存在了
      throw new BadRequestException('用户名已经存在了!')
    } else {
      // 注册用户
      // 加密密码
      const _password = encrpty(password, PASSWORD_SECRET)
      // 保存用户记录
      // @ts-ignore
      const user = await this.userModel.create({
        password: _password,
        username,
        role
      })
      return user
    }
  }
  /**
   * 通过主键查找用户
   * @param uid 用户id
   * @returns 
   */
  async findUser(uid: number) {
    return this.userModel.findByPk(uid)
  }
  /**
   * 根据用户名称查找用户
   * @param username 用户名称
   * @returns 
   */
  async findUserByusername(username: string) {
    const user = await this.userModel.findOne({
      where: {
        username
      }
    })
    return user
  }
  /**
   * 更新用户基本信息
   * @param uid 用户id
   * @param userUpdateDto 用户数据 
   */
  async updateUser(uid: number, { username, avatar }: UserUpdateDto) {
    // 查询id是否存在
    const user = await this.findUser(uid)
    if (user === null) {
      // 用户不存在
      throw new NotFoundException('该用户id不存在!')
    }
    // 用户存在,查询除了该用户以外是否还有其他同名用户
    const userOther = await this.userModel.findOne({
      where: {
        username,
        // 查询非更改用户以外的用户是否有同名的
        uid: {
          [Op.not]: uid
        }
      }
    })
    if (userOther) {
      // 用户名重复
      throw new BadRequestException('用户名已经存在了!')
    }
    // 修改用户信息
    user.username = username
    user.avatar = avatar
    await user.save()
    return true
  }
  /**
   * 更新用户密码
   * @param uid 用户id
   * @param password 用户密码
   */
  async updateUserPassword(uid: number, password: string) {
    // 用户是否存在
    const user = await this.findUser(uid)
    if (user) {
      // 加密密码
      const _password = encrpty(password, PASSWORD_SECRET)
      user.password = _password
      await user.save()
      return true
    } else {
      throw new NotFoundException('此用户id不存在!')
    }
  }
}
```



#### 5.模块

User模块最终如下

```ts
import { Module } from "@nestjs/common";
import { userProvider } from "./user.provider";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";

@Module({
  controllers: [
    UserController
  ],
  // 注入
  providers: [
    ...userProvider,
    UserService
  ],
  // 导出
  exports: [
    // 导出user提供者
    ...userProvider,
    // 导出服务层
    UserService
  ]
})
export class UserModule { }

```

### 加密

 	数据库中某些字段需要加密，比如用户密码，不适合明文显示在数据库中。

安装依赖

```shell
pnpm add crypto-js
```

封装加密解密函数

```ts
const Crypto=require('crypto-js')

export const SECRET_KEY = '****'

/**
 * AES对称加密
 * @param content 明文 
 * @param key 密钥
 * @returns 加密结果
 */
export const encrpty = (content: string, key: string) => {
  return Crypto.AES.encrypt(content,key).toString()
}

/**
 * AES解密
 * @param encrptyStr 密文
 * @param key 密钥
 * @returns 解密内容
 */
export const decrpty = (encrptyStr: string,key:string) => {
  return Crypto.AES.decrypt(encrptyStr,key).toString(Crypto.enc.Utf8)
}
```

