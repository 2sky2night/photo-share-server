照片墙小项目

## 功能描述

 浏览分享照片的网站，用户可以分享、点赞、浏览照片。照片需要审核才可以被发布，管理员可以审核照片、超级管理员可以审核和管理所有账号。所有角色都可以修改自己的基本信息。角色有：用户 User、管理员 Admin、超级管理员 SuperAdmin。

用户：只能进入前台页面，查看、点赞、分享照片，修改自己的基本资料，查看自己分享的照片（包括审核、未审核的照片），用户点击详情照片后需要上报信息。

管理员：只能进入后台页面，审核照片列表，查看已经审核的照片列表（只能查看自己审核的照片），修改自己的基本信息。

超级管理员：只能进入后台页面，审核照片列表，查看所有已经审核通过的照片列表，修改所有账户的基本信息，下发管理员账户。

## 实体

用户(uid、username、password、avatar、role)、照片(pid、title、content、photos)。

### 联系

照片实体（添加外键，publish_uid）：一个用户可以发布多个照片，一个照片只能对应一个发布者（用户--（发布）--照片）1 对多

照片实体(添加外键，audit_uid,添加审核时间:audit_time,添加审核描述:audit_desc，审核状态:status)一个管理员可以审核多个照片，一个照片只能被一个管理员审核 （用户--（审核）-照片-）1 对多

用户点赞照片(添加联系表，uid、pid):一个用户可以点赞多个照片，一个照片也能被多个用户点赞 （用户--（点赞）--照片）多对多

用户评论照片(添加评论表，uid、content、pid)，一个用户可以评论多个照片，一个照片也能被多个用户评论 (用户--（评论）--照片)

### 模型

user:uid、username、password、avatar、role

photo:pid、title、content、photos、publish_uid、audit_uid、audit_time、audit_desc、status

userLikePhoto:pid、uid

userCommentPhoto:pid、uid、content

## 服务

我们使用的技术栈：

Nest.js：提供 Http 接口

sequelize-typescript：操作 DB

Mysql2：数据库驱动

### 一、环境搭建

#### 1.热重载、ts 编译器

##### 安装依赖

```shell
pnpm add typescript、ts-node、nodemon -D
```

##### 配置 ts 编译器

初始化编译器，并且由于要使用装饰器，所以要修改 ts 配置项。要是报错 tsc 不是命令则需要全局安装 typescript。

```shell
tsc --init
```

```json
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
```

ts2564 错误：声明的属性未在构造函数中初始化？解决，在 ts.config.json 中配置

```json
  "strictPropertyInitialization": false
```

##### 配置热重载

 nodemon 监听 src 文件夹，src 文件夹内部文件有改动就执行 ts-node src/main.ts

```json
{
  "scripts": {
    "start:dev": "nodemon --watch src --exec ts-node src/main.ts"
  }
}
```

#### 2.Nest.js 初始化

##### Nest.js 开发必要的包

```shell
pnpm add @nestjs/core @nestjs/common
```

##### Nest.js 的平台，Nest 的基础服务我选择 express

```shell
pnpm add @nestjs/platform-express express
pnpm add @types/express -D
```

##### 启动 Nest 应用

 创建根模块以及配置相关设置，启动应用。

```ts
// 根模块
import { Module } from "@nestjs/common";

@Module({
  controllers: [],
  providers: [],
})
export class AppModule {}
```

```ts
// main.ts
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { PORT } from "./config";

async function appStart() {
  const app = await NestFactory.create(AppModule);
  app.listen(PORT, () => console.log(`http://127.0.0.1:${PORT}`));
}
appStart();
```

#### 3.Sequelize 初始化

##### 1.安装依赖

sequelize 作为操作 DB 的框架，Mysql2 作为连接 DB 的驱动器

```shell
 pnpm add @nestjs/sequelize sequelize sequelize-typescript mysql2
```

还需要安装对 sequelize 的类型支持

```shell
pnpm add @types/sequelize -D
```

##### 2.连接数据库，并 sequelize 实例封装成 Nest 的提供者

连接数据库配置项

```ts
import { SequelizeOptions } from "sequelize-typescript";

/**
 * 数据库连接配置项
 */
export const databaseConfig: SequelizeOptions = {
  dialect: "mysql",
  host: "localhost",
  database: "*****",
  username: "root",
  password: "****",
  port: 3306,
};
```

封装提供者

```ts
import { Provider } from "@nestjs/common";
import { databaseConfig } from "../config";
import { Sequelize } from "sequelize-typescript";

export const databaseProvider: Provider[] = [
  {
    provide: "DATABASE",
    async useFactory() {
      const sequelize = new Sequelize(databaseConfig);
      // 添加模型
      sequelize.addModels([]);
      // 根据模型创建表
      await sequelize.sync();
      return sequelize;
    },
  },
];
```

##### 3.将数据库封装模块，并导出数据

 通过 Module 装饰器修饰 DatabaseModule，把他当作一个模块，通过 provider 将 sequelize 作为模块的提供者，通过 export 将 sequelize 暴露出去，这样其他模块可以通过 import 导入就可以使用 sequelize 了。

```ts
import { Module } from "@nestjs/common";
import { databaseProvider } from "./database.provider";

@Module({
  providers: [...databaseProvider],
  exports: [...databaseProvider],
})
export class DatabaseModule {}
```

##### 4.在 App 根模块中导入数据库模块

这样整个 Nest 应用都被注入了 sequelize 实例了。

```ts
import { Module } from "@nestjs/common";
import { DatabaseModule } from "./database/database.module";

@Module({
  imports: [DatabaseModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
```

### 二、中间件

#### 1.统一的响应风格

 使用拦截器实现统一的响应风格，拦截器可以控制处理函数的执行且可以调用处理函数，并获得处理函数的结果，还可以二次加工结果，将加工后的结果响应给客户端。

##### 定义拦截器

```ts
// common/interceptor/response.interceptor.ts
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler
  ): Observable<any> | Promise<Observable<any>> {
    // next.handle可以调用路由处理函数，pipe操作可以访问响应结果
    // map可以格式化响应结果
    // return 关键字可以将结果返回给客户端
    return next.handle().pipe(
      map((data) => {
        return {
          data,
          code: 200,
          msg: "ok",
        };
      })
    );
  }
}
```

##### 注册全局响应拦截器

```ts
app.useGlobalInterceptors(new ResponseInterceptor());
```

#### 2.统一的业务错误响应

使用 Nest 提供的过滤器可以过滤 http（业务）请求失败，从而响应统一格式的错误信息。

##### 定义

```ts
// common/filter/http-exception.filter.ts
import {
  Catch,
  HttpException,
  ExceptionFilter,
  ArgumentsHost,
} from "@nestjs/common";
import { Response, Request } from "express";
// 捕获http错误 400--5xx
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const requst = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const message = exception.message;

    response.status(status).json({
      code: status,
      msg: message,
      timestamp: Date.now(),
      path: requst.path,
      method: requst.method,
    });
  }
}
```

##### 注册 http 错误过滤器

```ts
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { PORT } from "./config";
import { ResponseInterceptor } from "./common/interceptor";
import { HttpExceptionFilter } from "./common/filter";

async function appStart() {
  const app = await NestFactory.create(AppModule);
  // 注册http请求错误过滤器
  app.useGlobalFilters(new HttpExceptionFilter());
  // 注册响应拦截器
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.listen(PORT, () => console.log(`http://127.0.0.1:${PORT}`));
}
appStart();
```

#### 3.统一的内部错误响应

有时候语法出错或编译器出错或内部库出错，给客户端友好的响应服务器出错的信息。我们这里使用过滤器

##### 定义

```ts
import { ExceptionFilter, Catch, ArgumentsHost } from "@nestjs/common";
import { Request, Response } from "express";

@Catch()
export class InternalErrorFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    response.status(500).json({
      code: 500,
      msg: "Internal Server Error",
      timestamp: Date.now(),
      path: request.path,
      method: request.method,
    });
  }
}
```

##### 注册

```ts
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { PORT } from "./config";
import { ResponseInterceptor } from "./common/interceptor";
import { HttpExceptionFilter, InternalErrorFilter } from "./common/filter";

async function appStart() {
  const app = await NestFactory.create(AppModule);
  // 注册捕获全部错误过滤器，一定要在http请求错误过滤器的上面，不然http错误响应会被覆盖掉
  app.useGlobalFilters(new InternalErrorFilter());
  // 注册http请求错误过滤器
  app.useGlobalFilters(new HttpExceptionFilter());
  // 注册响应拦截器
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.listen(PORT, () => console.log(`http://127.0.0.1:${PORT}`));
}
appStart();
```

#### 4.打印请求日志

 拦截器可以在调用处理函数前后可以做一些事情，我们可以在客户端请求接口时会打印请求接口的状态，在接口出现内容错误时也能及时定位到错误的路由处理函数。

##### 定义

```ts
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from "@nestjs/common";
import { Observable, catchError, throwError } from "rxjs";
import { tap } from "rxjs/operators";
import { Request } from "express";
import { format } from "util";

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
        this.logger.error(
          format(
            "%s %s %dms %s",
            request.method,
            request.url,
            Date.now() - start,
            error
          )
        );
        return throwError(error);
      }),
      // 成功
      tap((response) => {
        // 打印请求方法，请求链接，处理时间和响应数据
        this.logger.log(
          format(
            "%s %s %dms %s",
            request.method,
            request.url,
            Date.now() - start,
            JSON.stringify(response)
          )
        );
      })
    );
  }
}
```

##### 注册

```ts
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { PORT } from "./config";
import { AppLogger, ResponseInterceptor } from "./common/interceptor";
import { HttpExceptionFilter, InternalErrorFilter } from "./common/filter";

async function appStart() {
  const app = await NestFactory.create(AppModule);
  // 注册捕获全部错误过滤器
  app.useGlobalFilters(new InternalErrorFilter());
  // 注册http请求错误过滤器
  app.useGlobalFilters(new HttpExceptionFilter());
  // 注册响应拦截器
  app.useGlobalInterceptors(new ResponseInterceptor());
  // 注册打印拦截器
  app.useGlobalInterceptors(new AppLogger());
  // api根路径
  app.setGlobalPrefix("/api");
  app.listen(PORT, () => console.log(`http://127.0.0.1:${PORT}`));
}
appStart();
```

#### 5.管道

 通过编写自定义管道，可以在校验参数失败时，定义响应错误的原因，Nest 内置的 ValidationPipe 不能响应自定义的内容。

##### 全局校验对象管道

```ts
import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from "@nestjs/common";
import { validate } from "class-validator";
import { plainToInstance } from "class-transformer";

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
        const tips = Object.values(errors[0].constraints)[0];
        throw new BadRequestException(`表单校验失败:${tips}`);
      } else {
        throw new BadRequestException("表单校验失败!");
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

##### 照片 id 管道

​	校验参数的管道，pid，照片必须存在才能放行的中间件。

```ts
import { BadRequestException, NotFoundException, PipeTransform } from "@nestjs/common";
import { Photo } from "../../modules/photo/model/photo.model";
import tips from "../tips";

export class PhotoPipe implements PipeTransform<string, Promise<number>> {
  private photoModel: typeof Photo
  constructor() {
    this.photoModel = Photo
  }
  async transform(pid: string) {
    // value为传入的值,该函数返回啥则被修饰的参数就会是什么
    // 解析pid
    const _pid = +pid
    if (isNaN(_pid)) {
      throw new BadRequestException(tips.paramsError('pid'))
    }
    // 查询pid在数据库中是否存在
    const photo = await this.photoModel.findByPk(_pid)
    if (photo === null) {
      throw new NotFoundException(tips.notFound('照片'))
    }
    return _pid
  }
}
```

##### offset管道

```ts
import { BadRequestException, PipeTransform } from "@nestjs/common";

/**
 * offset管道
 */
export class OffsetPipe implements PipeTransform<string | undefined, number> {
  transform(value: string | undefined) {
    if (value === undefined) {
      // 默认offset为0
      return 0
    }
    const offset = parseInt(value)
    if (isNaN(offset)) {
      throw new BadRequestException('offset必须为数字型!')
    }
    if (offset < 0) {
      throw new BadRequestException('offset必须为正数!')
    }
    return offset
  }
}
```

##### limit管道

```ts
import { BadRequestException, PipeTransform } from "@nestjs/common";

/**
 * limit管道
 */
export class LimitPipe implements PipeTransform<string | undefined, number> {
  transform(value: string | undefined) {
    if (value === undefined) {
      // 默认limit为20
      return 20
    }
    const limit = parseInt(value)
    if (isNaN(limit)) {
      throw new BadRequestException('limit必须为数字型!')
    }
    if (limit <= 0) {
      throw new BadRequestException('limit非法!')
    }
    return limit
  }
}
```

##### 照片审核状态管道

```ts
import { BadRequestException, PipeTransform } from "@nestjs/common";
import { AuditStatus, AuditStatusList } from "../../types/photo";

/**
 * 照片审核状态管道
 */
export class StatusPipe implements PipeTransform<string|undefined, AuditStatus> {
  transform(value: string|undefined): AuditStatus {
    if (value === undefined) {
      // 默认查找审核通过的
      return AuditStatusList.Pass
    }
    const status = +value
    if (isNaN(status)) {
      throw new BadRequestException('审核状态不合法!')
    }
    if (status !== AuditStatusList.NoPass && status !== AuditStatusList.Pass && status !== AuditStatusList.NotAudit) {
      throw new BadRequestException('审核状态不合法!')
    }
    return status
  }
}
```

##### 可选用户管道

​	若传入了参数，则需要解析校验参数，并且要拿这个参数当前uid查询用户是否存在，且用户角色必须是User

```ts
import { ArgumentMetadata, BadRequestException, NotFoundException, PipeTransform } from "@nestjs/common";
import tips from "../tips";
import { User } from "../../modules/user/model/user.model";
import { Roles } from "../../modules/auth/role";

/**
 * 可选用户管道，若参数为undefined，则直接返回，若传入了参数，则需要检验用户是否存在，且用户角色必须是User
 */
export class UserOptionalPipe implements PipeTransform<string, Promise<number | undefined>>{
  userModel: typeof User
  constructor() {
    this.userModel = User
  }
  async transform(value: string | undefined): Promise<number | undefined> {
    if (value === undefined) {
      return undefined
    }
    const uid = +value
    if (isNaN(uid)) {
      throw new BadRequestException(tips.paramsError('uid'))
    }
    await this.getUser(uid)
    return uid
  }
  async getUser(uid: number) {
    const user = await this.userModel.findByPk(uid)
    if (user === null) {
      throw new NotFoundException(tips.noExist('用户'))
    }
    if (user.role !== Roles.User) {
      throw new BadRequestException(tips.roleError)
    }
  }
}
```

##### 必选User管道

解析参数，参数作为用户id，且用户必须存在，且用户角色必须是User

```ts
import { BadRequestException, NotFoundException, PipeTransform } from "@nestjs/common";
import { User } from "../../modules/user/model/user.model";
import tips from "../tips";
import { Roles } from "../../modules/auth/role";

/**
 * 用户管道，解析参数，并查询用户是否存在，且用户角色必须是User
 */
export class UserPipe implements PipeTransform<string, Promise<number>>{
  userModel: typeof User
  constructor() {
    this.userModel = User
  }
  async transform(value: string): Promise<number> {
    const uid = +value
    if (isNaN(uid)) {
      throw new BadRequestException(tips.paramsError('uid'))
    }
    await this.getUser(uid)
    return uid
  }
  async getUser(uid: number) {
    const user = await this.userModel.findByPk(uid)
    if (user === null) {
      throw new NotFoundException(tips.noExist('用户'))
    }
    if (user.role !== Roles.User) {
      throw new BadRequestException(tips.roleError)
    }
  }
}
```

##### 审核通过的照片管道

 照片必须存在，且照片必须是审核通过的才能放行的管道

```ts
import { BadRequestException, NotFoundException, PipeTransform } from "@nestjs/common";
import { Photo } from "../../modules/photo/model/photo.model";
import tips from "../tips";
import { AuditStatusList } from "../../types/photo";

export class PhotoPassPipe implements PipeTransform<string, Promise<number>>{
  private photoModel: typeof Photo
  constructor() {
    this.photoModel = Photo
  }
  async transform(pid: string) {
    // value为传入的值,该函数返回啥则被修饰的参数就会是什么
    // 解析pid
    const _pid = +pid
    if (isNaN(_pid)) {
      throw new BadRequestException(tips.paramsError('pid'))
    }
    // 查询pid在数据库中是否存在
    const photo = await this.photoModel.findByPk(_pid)
    if (photo === null) {
      throw new NotFoundException(tips.notFound('照片'))
    }
    if (photo.status === AuditStatusList.Pass) {
      // 审核通过的照片
      return _pid
    } else {
      throw new BadRequestException(tips.photoIsNotAudit)
    }
  }
}
```



#### 6.解析 token 的中间件

若用户请求头部 authorization 携带了 token 就解析并保存在上下文中

```ts
import { NestMiddleware, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request, Response } from "express";
import { JWT_SECRET } from "../../config";

export class TokenParseMiddleware implements NestMiddleware {
  jwtService: JwtService;
  constructor() {
    this.jwtService = new JwtService();
  }
  async use(req: Request, _res: Response, next: (error?: any) => void) {
    const token = this.getToken(req);
    if (token) {
      // 有token，需要校验token
      try {
        const playload = await this.jwtService.verifyAsync(token, {
          secret: JWT_SECRET,
        });
        // @ts-ignore 将解析出来的数据保存到上下文中
        req.user = playload;
        next();
      } catch (error) {
        throw new UnauthorizedException();
      }
    } else {
      next();
    }
  }
  getToken(req: Request) {
    const authorization = req.headers.authorization;
    if (authorization === undefined) {
      // 未携带token
      return undefined;
    } else {
      const [type, token] = authorization.split(" ");
      if (type === "Bearer") {
        return token;
      } else {
        // 非jwt类型的token或其他字符串
        throw new UnauthorizedException();
      }
    }
  }
}
```

#### 7.解析保存上下文中的 token 用户数据

 使用参数装饰器并修饰在控制层处理函数中可以很方便的数据注入到处理函数中。对于我们把 token 数据保存在请求上下文中需要我们手动`req.user`获取数据，有点麻烦。可以封装一个装饰器来快捷的获取到上下文中的指定内容。

##### 简单示例：

 返回的内容会直接注入到对应修饰的参数中

```ts
import { createParamDecorator } from "@nestjs/common";
import { ExecutionContextHost } from "@nestjs/core/helpers/execution-context-host";

export const Token = createParamDecorator(
  (data, input: ExecutionContextHost) => {
    return "123";
  }
);
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

export const Token = createParamDecorator(
  (data: "sub" | "iat" | "exp" | undefined, input: ExecutionContextHost) => {
    // data为装饰器调用时传入的参数，这里我们可以通过他结构出token中的某个属性
    const request = input.switchToHttp().getRequest<Request>();
    // @ts-ignore
    const tokenData: TokenData = request.user;
    // 若中间件解析了token并保存在上下文中
    if (tokenData) {
      if (data === undefined) {
        // 不解构属性
        return tokenData;
      } else {
        // 解构属性
        if (Object.keys(tokenData).includes(data)) {
          return tokenData[data];
        } else {
          throw new BadGatewayException(`token中无该属性:${data}`);
        }
      }
    } else {
      throw new BadGatewayException("上下文中无解析的token数据!");
    }
  }
);
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

 通过路由守卫，可以很好的限制哪些用户可以访问该接口。由于守卫也属于中间件的一种，我们也可以通过他来访问上下文，并把解析出来的数据保存在上下文中，方便路由处理函数获取 token 数据。

##### 定义路由守卫

```ts
import {
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { Request } from "express";
import { JwtService } from "@nestjs/jwt";
import { JWT_SECRET } from "../../config";
import { TokenData } from "../../types/token";
import { User } from "../../modules/user/model/user.model";

export class AuthGuard implements CanActivate {
  private jwtService: JwtService;
  private userModel: typeof User;
  constructor() {
    this.jwtService = new JwtService();
    this.userModel = User;
  }
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.getToken(request);
    // 解析token
    try {
      const playload = await this.jwtService.verifyAsync<TokenData>(token, {
        secret: JWT_SECRET,
      });
      // 查询此用户id的用户是否存在
      await this.find(playload.sub);
      // @ts-ignore
      request.user = playload;
      return true;
    } catch (error) {
      console.log(error);
      throw new UnauthorizedException("token不合法!");
    }
  }
  // 查询用户是否存在
  async find(uid: number) {
    const user = await this.userModel.findByPk(uid);
    if (user === null) {
      throw new UnauthorizedException("用户id不合法!");
    }
  }
  // 从请求头部获取token
  getToken(req: Request) {
    const authorization = req.headers.authorization;
    if (authorization === undefined) {
      // 未携带token
      throw new UnauthorizedException("未携带token!");
    } else {
      const [type, token] = authorization.split(" ");
      if (type === "Bearer") {
        return token;
      } else {
        // 非jwt类型的token或其他字符串
        throw new UnauthorizedException("token不合法!");
      }
    }
  }
}
```

##### 参数装饰器解析 token

 将 token 数据保存在上下文时，在路由处理函数我们需要使用@Req 装饰器来获取 request，再链式访问才能获取到解析出来的 token 数据，会比较麻烦，我们可以封装一个参数装饰器，来快速获取上下文中的 token

```ts
import { BadGatewayException, createParamDecorator } from "@nestjs/common";
import { ExecutionContextHost } from "@nestjs/core/helpers/execution-context-host";
import { Request } from "express";
import { TokenData } from "../../types/token";

export const Token = createParamDecorator(
  (data: "sub" | "iat" | "exp" | undefined, input: ExecutionContextHost) => {
    // data为装饰器调用时传入的参数，这里我们可以通过他结构出token中的某个属性
    const request = input.switchToHttp().getRequest<Request>();
    // @ts-ignore
    const tokenData: TokenData = request.user;
    // 若中间件解析了token并保存在上下文中
    if (tokenData) {
      if (data === undefined) {
        // 不解析属性
        return tokenData;
      } else {
        if (Object.keys(tokenData).includes(data)) {
          return tokenData[data];
        } else {
          throw new BadGatewayException(`token中无该属性:${data}`);
        }
      }
    } else {
      throw new BadGatewayException("上下文中无解析的token数据!");
    }
  }
);
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

 角色守卫会在执行路由处理函数前，根据当 token 中的 uid 来检查用户拥有的角色，若用户的角色满足该路由的访问权限就可以调用该接口。

##### 路由元数据

 我们需要使用自定义方法装饰器给路由处理函数挂载元数据，给路由处理函数设置哪些角色可以访问该路由的信息。这样我们的角色守卫就可以获取路由处理函数的元数据从而知晓该路由处理函数所需要的权限。

```ts
// role.decorator.ts
import { SetMetadata } from "@nestjs/common";
import { Role as RoleType } from "../../modules/auth/role";

export const Role = (...roles: RoleType[]) => {
  return SetMetadata("roles", roles);
};
```

##### 定义角色守卫

```ts
import {
  BadGatewayException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Role } from "../../modules/auth/role";
import { Request } from "express";
import { TokenData } from "../../types/token";
import { User } from "../../modules/user/model/user.model";

@Injectable()
export class RoleGuard implements CanActivate {
  private userModel: typeof User;
  constructor(private reflector: Reflector) {
    this.userModel = User;
  }
  // 获取用户的id，通过用户id来查询用户的角色，再通过角色和路由处理函数所需的角色来判断用户是否有权限放行守卫
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 通过reflector可以获取到路由处理函数保存的元数据(SetMetData)
    const roles = this.reflector.get<Role[]>("roles", context.getHandler());
    const request = context.switchToHttp().getRequest<Request>();
    // @ts-ignore
    const playload = request.user as TokenData;
    if (playload === undefined) {
      // 若无中间件解析token数据
      throw new BadGatewayException("请求上下文中无解析的token数据!");
    } else {
      // 查询用户角色
      const user = await this.userModel.findByPk(playload.sub);
      if (user === null) {
        // 用户表不存在该id
        throw new NotFoundException("此用户id不存在!");
      }
      if (roles.includes(user.role)) {
        return true;
      } else {
        throw new ForbiddenException("无权限访问!");
      }
    }
  }
}
```

##### 使用

注意方法装饰器的执行顺序，Role 设置路由元数据的顺序需要早于守卫的

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

#### 10.静态图片资源中间件

​	上传图片后，图片会保存在本地磁盘里面，我们需要服务器将这些静态资源映射出来，这样外部就能请求加载这些资源从而访问图片了。

​	通过文件流分片段读取数据到内存中，减少开销，读取完成后，返回给客户端。

```ts
import { InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { Request, Response } from "express";
import fs from 'fs'
import path from 'path'
export async function StaticImgMiddleware(req: Request, res: Response, next: any) {

  if (req.path.substring(0, 7) === '/static') {
    // 静态资源路径是否存在?
    const rootPath = path.resolve('./src/static')
    if (!fs.existsSync(rootPath)) {
      res.status(500).json({
        code: 500,
        msg: 'Internal Server Error',
        timestamp: Date.now()
      })
      console.error('服务器未挂载静态图片资源!')
      return
    }
    // 截取路径
    // 并将url编码解码，解决中文字符被转码，导致路径与实际存储的路径不一致导致读取不到对应文件
    // 因为发送请求时会自动把url中某些字符转码，导致中文字符被转码，不能读取到对应的文件
    const staticPath = decodeURI(req.path.substring(7))
    // 拼接路径
    const filePath = path.resolve('./src/static', `.${staticPath}`)
    // 若文件存在
    if (fs.existsSync(filePath)) {
      const fileData = await new Promise((resolve) => {
        const bufferArray: Buffer[] = []
        // 每次读取100kb的数据
        const rs = fs.createReadStream(filePath, { highWaterMark: 1024 * 100 })
        // 每次读取数据时保存该文件片段
        rs.on('data', (chuck: Buffer) => {
          bufferArray.push(chuck)
        })
        rs.on('end', () => {
          resolve(Buffer.concat(bufferArray))
        })
        rs.on('error', () => {
          throw new InternalServerErrorException('读取文件失败!')
        })
      })
      // 设置响应头部为图片类型，若不设置响应体类型返回二进制文件会直接下载文件，这样设置会被解析成图片文件了
      res.setHeader('content-type', 'image/jpeg')

      res.send(fileData)
    } else {
      throw new NotFoundException('静态资源不存在!')
    }

  } else {
    next()
  }
}
```

#### 11.User拦截器

​	拦截管理员和超级管理员的拦截器

```ts
import { CallHandler, ExecutionContext, ForbiddenException, NestInterceptor, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";
import { Observable } from "rxjs";
import { JWT_SECRET } from "../../config";
import { TokenData } from "../../types/token";
import { User } from "../../modules/user/model/user.model";
import { Roles } from "../../modules/auth/role";

/**
 * 用户拦截器，不拦截User和未登录用户
 */
export class UserInterceptor implements NestInterceptor {
  jwtService: JwtService
  userModel: typeof User
  constructor() {
    this.jwtService = new JwtService()
    this.userModel = User
  }
  async intercept(context: ExecutionContext, next: CallHandler<any>): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest<Request>()
    const token = this.getToken(request)
    if (token !== undefined) {
      try {
        const playload = await this.jwtService.verifyAsync(token, { secret: JWT_SECRET }) as TokenData
        await this.checkUser(playload.sub)
        // @ts-ignore 将解析出的token保存在上下文
        request.user = playload
        return next.handle()
      } catch (error: any) {
        throw new UnauthorizedException(error.toString ? error.toString() : 'token不合法!')
      }
    } else {
      return next.handle()
    }
  }
  async checkUser(uid: number) {
    const user = await this.userModel.findByPk(uid)
    if (user === null) {
      throw new UnauthorizedException('此用户id不存在!')
    } else {
      if (user.role !== Roles.User) {
        throw new ForbiddenException('无权访问!')
      }
    }
  }
  getToken(req: Request) {
    const authorization = req.headers.authorization
    if (authorization === undefined) {
      return undefined
    } else {
      const [type, token] = authorization.split(' ')
      if (type === 'Bearer') {
        return token
      } else {
        throw new UnauthorizedException('token不合法!')
      }
    }
  }
}
```

#### 12.可选token解析的参数装饰

​	有时候我们需要登录用户和未登录用户展示不同内容时，需要解析token中的数据，若未登录(无token)就不解析数据，登录了就解析token数据。

```ts
import { InternalServerErrorException, createParamDecorator } from "@nestjs/common";
import { TokenData, TokenKey } from "../../types/token";
import { ExecutionContextHost } from "@nestjs/core/helpers/execution-context-host";

export const TokenOptional = createParamDecorator(
  (data: TokenKey, input: ExecutionContextHost) => {
    const request = input.switchToHttp().getRequest()
    const playload = request.user as TokenData
    if (playload === undefined) {
      // 未登录用户
      return undefined
    } else {
      // 登录用户
      if (data === undefined) {
        // 未指定属性值
        return playload
      } else {
        const value = playload[data]
        if (value === undefined) {
          throw new InternalServerErrorException(`token中没有该属性:${data}`)
        } else {
          return value
        }
      }
    }
  }
)
```



### 三、auth 模块

 auth 模块主要是做登录、注册和一些需要角色权限的操作。auth 模块需要导入 user 模块，就能直接注册 user 模块所有内容了（路由也能注册）。

接口：登录、注册、修改用户信息

#### 1.服务层

##### 登录

 调用 userService 查询用户名是否存在，再解密密码，校验密码和请求体中的密码是否一致，从而下发 token

##### 注册

 调用 userService 层，查询用户名是否存在，加密密码，创建用户。

##### 修改指定用户的全部信息

 分别调用 userService 的修改用户基本信息和用户密码。

##### 超级管理员下发Admin账户

​	超级管理员可以创建Admin角色的账户，通过守卫只允许超级管理员访问该接口。

##### 源代码

```ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { UserService } from "../user/user.service";
import { AuthRegisterDto } from "./dto/auth-register.dto";
import { Roles } from "./role";
import { AuthLoginDto } from "./dto/auth-login.dto";
import { decrpty } from "../../common/crypto";
import { PASSWORD_SECRET } from "../../config";
import { JwtService } from "@nestjs/jwt";
import { AuthUpdateDto } from "./dto/auth-update.dto";

@Injectable()
export class AuthService {
  constructor(
    // 注入用户服务层 不需要使用Inject来注入，因为UserService已经作为模块的提供者了
    private userService: UserService,
    // 注入jwt
    private jwtService: JwtService
  ) {}
  /**
   * 注册
   */
  register(authRegisterDto: AuthRegisterDto) {
    return this.userService.createUser(authRegisterDto, Roles.User);
  }
  /**
   * 登录
   */
  async login({ username, password }: AuthLoginDto) {
    // 查询用户名称是否存在
    const user = await this.userService.findUserByusername(username);
    if (user === null) {
      // 用户不存在
      throw new NotFoundException("用户名不存在!");
    }
    // 密码是否匹配
    const _dePassword = decrpty(user.password, PASSWORD_SECRET);
    if (_dePassword === password) {
      // 下发token
      return {
        access_token: await this.jwtService.signAsync({
          sub: user.uid,
        }),
      };
    } else {
      throw new BadRequestException("用户名或密码错误!");
    }
  }
  /**
   * 更新指定的用户信息
   */
  async updateUser(uid: number, { username, password, avatar }: AuthUpdateDto) {
    // 更新用户基本信息
    await this.userService.updateUser(uid, { username, avatar });
    // 更新用户密码
    await this.userService.updateUserPassword(uid, password);
    return true;
  }
}
```



#### 2.控制层

##### 登录

 通过管道来校验请求体数据，进入服务层，查询用户名是否存在，存在就将加密的密码解密，再判断是否和传入的请求体中的 password 是否一致，一致就登录成功，下发 token。

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

 注册先通过中间件管道解析和校验请求体数据，成功就进入服务层，查询用户名是否已经存在了，未存在就创建一个角色为 user 的用户，密码使用 aes 对称加密。

```ts
  /**
   * 注册service
   */
  register(authRegisterDto: AuthRegisterDto) {
    return this.userService.createUser(authRegisterDto, Roles.User)
  }
```

##### 修改指定用户信息

 超级管理员可以随意修改所有用户的数据，注意修改密码时需要加密密码再保存到数据库中。

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

##### 下发管理员账号

​	超级管理员可以注册一个管理员账户

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
import { AuthRegiterAdminDto } from "./dto/auth-register-admin.dto";

@Controller('auth')
export class AuthController {
  constructor(
    // 注入auth服务层 不需要使用Inject来注入，因为AuthService在模块中已经作为提供者了
    private authService: AuthService
  ) { }

  // 注册一个普通用户
  @Post('register')
  async register(@Body(new ValidationPipe()) authRegisterDto: AuthRegisterDto) {
    await this.authService.register(authRegisterDto)
    return null
  }

  // 登录
  @Post('login')
  async login(@Body(new ValidationPipe()) authLoginDto: AuthLoginDto) {
    return await this.authService.login(authLoginDto)
  }

  // 超级管理员更新用户信息
  @Role(Roles.SuperAdmin)
  @UseGuards(AuthGuard, RoleGuard)
  @Put('update/:uid')
  async updateUser(@Param('uid', ParseIntPipe) uid: number, @Body(new ValidationPipe()) authUpdateDto: AuthUpdateDto) {
    await this.authService.updateUser(uid, authUpdateDto)
    return '更新用户信息成功!'
  }
  // 解析token
  @UseGuards(AuthGuard)
  @Get('token')
  token(@Req() req: Request, @Token() token: TokenData) {
    // @ts-ignore
    return req.user
  }
  // 超级管理员注册账户
  @Role(Roles.SuperAdmin)
  @UseGuards(AuthGuard, RoleGuard)
  @Post('register/admin')
  async registerAdmin(
    @Body(new ValidationPipe()) authRegiterAdminDto: AuthRegiterAdminDto
  ) {
    await this.authService.registerAdmin(authRegiterAdminDto)
    return null
  }
}
```

#### 3.模块

```ts
import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from "@nestjs/common";
import { UserModule } from "../user/user.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtModule } from "@nestjs/jwt";
import { JWT_SECRET } from "../../config";
import { TokenParseMiddleware } from "../../common/middleware";

@Module({
  imports: [
    UserModule,
    JwtModule.register({
      secret: JWT_SECRET,
      signOptions: {
        expiresIn: "24h",
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TokenParseMiddleware).forRoutes({
      path: "/auth/token",
      method: RequestMethod.GET,
    });
  }
}
```

### 四、User 模块

 user 模块主要负责对 user 的增删改查。

提供的服务：增加用户、修改用户基本信息、修改用户密码

提供的接口：修改用户基本信息、修改用户密码

#### 1.模型

##### 1.创建 user 模型

```ts
import {
  Table,
  Model,
  Column,
  PrimaryKey,
  Comment,
  DataType,
  AutoIncrement,
  Length,
  Default,
} from "sequelize-typescript";
import { Role, Roles, roles } from "../../auth/role";
@Table({
  tableName: "user",
})
export class User extends Model<User> {
  @Comment("账户id")
  @PrimaryKey
  @AutoIncrement
  @Column
  uid?: number;

  @Comment("账户名称")
  @Column(DataType.STRING)
  username?: string;

  @Comment("账户密码")
  @Column(DataType.STRING)
  passowrod?: string;

  @Length({ max: 512 })
  @Comment("账户头像")
  @Column(DataType.STRING)
  avatar?: string;

  @Comment("用户角色")
  @Column(DataType.ENUM(...roles))
  // @Default(Roles.User)
  role?: Role;
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
    provide: "DATABASE",
    async useFactory() {
      const sequelize = new Sequelize(databaseConfig);
      // 添加模型
      sequelize.addModels([User]);
      // 根据模型创建表
      await sequelize.sync();
      return sequelize;
    },
  },
];
```

#### 2.user 模块的提供者

 user 模块的提供者主要是为了提供操作 DB 的模型

```ts
import { Provider } from "@nestjs/common";
import { User } from "./model/user.model";

export const userProvider: Provider[] = [
  {
    provide: "UserModel",
    useValue: User,
  },
];
```

将 user 提供者注入到 user 模块中并暴露 user 提供者，让外部模块导入使用

```ts
import { Module } from "@nestjs/common";
import { userProvider } from "./user.provider";

@Module({
  controllers: [],
  // 注入
  providers: [...userProvider],
  // 导出user提供者
  exports: [...userProvider],
})
export class UserModule {}
```

#### 3.控制层

 user 控制层主要负责用户信息查询、修改等功能。

##### 修改用户个人信息

 该接口场景：用户登录后修改自己的个人信息（用户名和头像）,通过管道校验数据后，调用 service 层。

##### 修改用户密码

 该接口场景：用户修改自己的密码，通过管道校验数据后，进入 service 层。

##### 获取用户基本信息

 该接口场景：用户登录后，查看该用户的基本信息，通过管道校验后，进入 service 层。

##### 源代码

```ts
import { Controller, Put, Body, UseGuards, Get } from "@nestjs/common";
import { ValidationPipe } from "../../common/pipe";
import { UserUpdateDto } from "./dto/user-update.dto";
import { UserService } from "./user.service";
import { AuthGuard } from "../../common/guard";
import { Token } from "../../common/decorator";
import { UserUpdatePasswordDto } from "./dto/user-update-password.dto";

@Controller("user")
export class UserController {
  constructor(private userService: UserService) {}
  @UseGuards(AuthGuard)
  @Put("update")
  // 修改用户基本信息(用户自己修改自己的信息)
  async updateUser(
    @Token("sub") uid: number,
    @Body(new ValidationPipe()) userUpdateDto: UserUpdateDto
  ) {
    await this.userService.updateUser(uid, userUpdateDto);
    return "更新用户信息成功!";
  }
  @UseGuards(AuthGuard)
  @Put("password")
  // 修改用户自己的密码
  async updatePassword(
    @Token("sub") uid: number,
    @Body(new ValidationPipe()) userUpdatePasswordDto: UserUpdatePasswordDto
  ) {
    await this.userService.updateUserPassword(
      uid,
      userUpdatePasswordDto.password
    );
    return "更新用户密码成功!";
  }
  // 获取用户基本信息
  @UseGuards(AuthGuard)
  @Get("info")
  async info(@Token("sub") uid: number) {
    return await this.userService.info(uid);
  }
}
```

#### 4.服务层

 user 服务层主要负责用户的增删改查。由于 auth 模块需要使用 user 服务层来操作 User 模型，所以需要 exports 用户服务层。

##### 查询用户名称

 根据用户名称查询用户

##### 查询用户 id

 根据主键查询用户

##### 修改用户信息

 修改用户的基本信息

##### 修改用户密码

 修改用户密码，注意密码需要加密后保存到数据库

##### 创建用户

 创建用户，需要检查用户名是否重复，还要注意密码需要加密后保存到数据库。

##### 查看用户基本信息

 通过数据库查询到该用户后，返回用数据。

##### 源代码

```ts
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
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
    @Inject("UserModel") private userModel: typeof User
  ) {}
  /**
   * 创建用户
   * @param authRegisterDto 创建用户的数据
   */
  async createUser({ username, password }: UserCreateDto, role: Role) {
    // 查询用户名是否重复
    const user = await this.findUserByusername(username);
    if (user !== null) {
      // 用户存在了
      throw new BadRequestException("用户名已经存在了!");
    } else {
      // 注册用户
      // 加密密码
      const _password = encrpty(password, PASSWORD_SECRET);
      // 保存用户记录
      // @ts-ignore
      const user = await this.userModel.create({
        password: _password,
        username,
        role,
      });
      return user;
    }
  }
  /**
   * 通过主键查找用户
   * @param uid 用户id
   * @returns
   */
  async find(uid: number) {
    return this.userModel.findByPk(uid);
  }
  /**
   * 根据用户名称查找用户
   * @param username 用户名称
   * @returns
   */
  async findUserByusername(username: string) {
    const user = await this.userModel.findOne({
      where: {
        username,
      },
    });
    return user;
  }
  /**
   * 更新用户基本信息
   * @param uid 用户id
   * @param userUpdateDto 用户数据
   */
  async updateUser(uid: number, { username, avatar }: UserUpdateDto) {
    // 查询id是否存在
    const user = await this.find(uid);
    if (user === null) {
      // 用户不存在
      throw new NotFoundException("该用户id不存在!");
    }
    // 用户存在,查询除了该用户以外是否还有其他同名用户
    const userOther = await this.userModel.findOne({
      where: {
        username,
        // 查询非更改用户以外的用户是否有同名的
        uid: {
          [Op.not]: uid,
        },
      },
    });
    if (userOther) {
      // 用户名重复
      throw new BadRequestException("用户名已经存在了!");
    }
    // 修改用户信息
    user.username = username;
    user.avatar = avatar;
    await user.save();
    return true;
  }
  /**
   * 更新用户密码
   * @param uid 用户id
   * @param password 用户密码
   */
  async updateUserPassword(uid: number, password: string) {
    // 用户是否存在
    const user = await this.find(uid);
    if (user) {
      // 加密密码
      const _password = encrpty(password, PASSWORD_SECRET);
      user.password = _password;
      await user.save();
      return true;
    } else {
      throw new NotFoundException("此用户id不存在!");
    }
  }
}
```

#### 5.模块

User 模块最终如下

```ts
import { Module } from "@nestjs/common";
import { userProvider } from "./user.provider";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";

@Module({
  controllers: [UserController],
  // 注入
  providers: [...userProvider, UserService],
  // 导出
  exports: [
    // 导出user提供者
    ...userProvider,
    // 导出服务层
    UserService,
  ],
})
export class UserModule {}
```

### 五、照片模块

#### 1.模型

##### Photo

```ts
import { Table, Model, Column, PrimaryKey, AutoIncrement, Comment, DataType, Length, ForeignKey, BelongsTo, NotNull, AllowNull, Default, BelongsToMany } from "sequelize-typescript";
import { User } from "../../user/model/user.model";
import { AuditStatusList } from "../../../types/photo";
import { UserLikePhoto } from "./user-like-photo.model";
import { UserCommentPhoto } from "./user-comment-photo";

@Table({
  tableName: 'photo'
})
export class Photo extends Model<Photo>{
  @PrimaryKey
  @AutoIncrement
  @Comment('照片id')
  @Column
  pid: number;

  @Length({ min: 1, max: 20, msg: '标题长度为1-20位字符!' })
  @Comment('照片标题')
  @Column(DataType.STRING)
  title: string;

  @Comment('照片的描述')
  @Length({ min: 1, max: 255, msg: '描述长度为1-255位字符!' })
  @Column(DataType.TEXT)
  content: string;

  @Comment('照片列表')
  @Column(DataType.JSON)
  photos: string;

  @ForeignKey(() => User)
  @Comment('照片作者id')
  @Column
  publish_uid: number;

  @ForeignKey(() => User)
  @Comment('审核人id')
  @Column
  audit_uid: number;

  @Comment('审核时间')
  @AllowNull
  @Column(DataType.DATE)
  audit_time: Date;

  @Comment('审核描述')
  @Length({ msg: '审核描述长度为1-255', min: 1, max: 255 })
  @AllowNull
  @Column(DataType.STRING)
  audit_desc: string | null;

  @Comment('审核状态，0未审核 1审核通过 2审核不通过')
  @Default(0)
  @Column(DataType.TINYINT)
  status: AuditStatusList

  @Comment('浏览量')
  @Default(0)
  @Column(DataType.INTEGER)
  views: number;

  // 一个照片只能有一个作者,(声明publish_uid是外键)
  @BelongsTo(() => User, 'publish_uid')
  author: User

  // 一个照片只能被一个管理员审核,(声明audit_uid是外键)
  @BelongsTo(() => User, 'audit_uid')
  auditor: User

  // 一个照片可以被多个用户喜欢
  @BelongsToMany(() => User, () => UserLikePhoto, 'pid')
  // 关联名称，sequelize会以likeds创建操作User的函数
  likeds: User[]

  // 一个照片有多个评论
  @BelongsToMany(() => User, () => UserCommentPhoto, 'pid')
  commentor:User[]

  /**
   * 获取喜欢该照片的用户
   */
  declare getLikeds: () => Promise<User[]>
}
```

##### UserLikePhoto

​	用户点赞照片模型，多对多

```ts
import { ForeignKey, Table,Model } from "sequelize-typescript";
import { User } from "../../user/model/user.model";
import { Photo } from "./photo.model";

@Table({
  tableName:'user_like_photo'
})
export class UserLikePhoto extends Model<UserLikePhoto> {
  @ForeignKey(() => User)
  uid: number;
  
  @ForeignKey(() => Photo)
  pid: number;

}
```

##### UserCommentPhoto

​	一个照片有多个用户评论，一个用户可以评论多个照片，多对多

```ts
import { Column, ForeignKey, Table, Comment, DataType, Length, Model, BelongsToMany, PrimaryKey } from "sequelize-typescript";
import { User } from "../../user/model/user.model";
import { Photo } from "./photo.model";
import { UserLikeComment } from "./user-like-comment.model";

@Table({ tableName: 'user_comment_photo' })
export class UserCommentPhoto extends Model<UserCommentPhoto> {

  @Comment('评论的id')
  @PrimaryKey
  @Column
  cid: number;

  @Comment('发布评论的用户')
  @ForeignKey(() => User)
  @Column
  uid: number;

  @Comment('评论的哪个照片')
  @ForeignKey(() => Photo)
  @Column
  pid: number

  @Comment('评论内容')
  @Length({ min: 1, max: 255, msg: '评论内容长度为1-255位!' })
  @Column(DataType.STRING)
  content: string;

  // 一个评论可以被多个用户点赞
  @BelongsToMany(() => User, () => UserLikeComment, 'cid')
  likedUser: User[]
}
```

##### UserLikeComment

​	用户可以点赞多个评论，一个评论可以被多个用户点赞，多对多

```ts
import { Column, Comment, ForeignKey, Model, Table } from "sequelize-typescript";
import { User } from "../../user/model/user.model";
import { UserCommentPhoto } from "./user-comment-photo";

@Table({ tableName: 'user_like_comment' })
export class UserLikeComment extends Model<UserLikeComment> {
  @ForeignKey(() => User)
  @Comment('点赞者')
  @Column
  uid: number;

  @Comment('点赞的目标评论')
  @ForeignKey(() => UserCommentPhoto)
  @Column
  cid: number;
}
```



##### User表需要更新与 Photo 的关系

```ts
import { Table, Model, Column, PrimaryKey, Comment, DataType, AutoIncrement, Length, Default, HasMany, BelongsTo, BelongsToMany } from "sequelize-typescript";
import { Role, Roles, roles } from "../../auth/role";
import { Photo } from "../../photo/model/photo.model";
import { UserLikePhoto } from "../../photo/model/user-like-photo.model";
import { UserCommentPhoto } from "../../photo/model/user-comment-photo";
import { UserLikeComment } from "../../photo/model/user-like-comment.model";
@Table({
  tableName: 'user'
})
export class User extends Model<User>{

  @Comment('账户id')
  @PrimaryKey
  @AutoIncrement
  @Column
  uid: number;

  @Comment('账户名称')
  @Column(DataType.STRING)
  username: string;

  @Comment('账户密码')
  @Column(DataType.STRING)
  password: string;

  @Length({ max: 512 })
  @Comment('账户头像')
  @Column(DataType.STRING)
  avatar: string;

  @Comment('用户角色')
  @Column(DataType.ENUM(...roles))
  // @Default(Roles.User)
  role: Role

  // 一个作者有多个照片 (这样设置后，publish_id会作为Photo表的外键，引用User表的uid，默认引用主键)
  @HasMany(() => Photo, 'publish_uid')
  authorPhotos: Photo[]

  // 一个审核可以审核多个照片 (这样设置后，audit_uid会作为Photo表的外键，引用User表的uid，自定义指定引用User的uid字段)
  @HasMany(() => Photo, {
    sourceKey: 'uid',
    foreignKey: 'audit_uid'
  })
  auditPhotos: Photo[]

  // 一个用户可以喜欢多个照片
  @BelongsToMany(() => Photo, () => UserLikePhoto, 'uid')
  likePhotos: Photo[]

  // 一个用户可以评论多个照片
  @BelongsToMany(() => Photo, () => UserCommentPhoto, 'uid')
  commentedPhotos: Photo[]

  // 一个用户可以点赞多个评论
  @BelongsToMany(() => UserCommentPhoto, () => UserLikeComment, 'uid')
  likedComments: UserCommentPhoto[]
}
```

#### 2.提供者

```ts
import { Provider } from "@nestjs/common";
import { Photo } from "./model/photo.model";

export const photoProvider: Provider[] = [
  {
    provide: "PhotoModel",
    useValue: Photo,
  },
];
```

#### 3.控制层

##### 发布照片

 通过管道中间件解析和校验请求体数据，并通过 SetMeta 来设置路由元数据，该接口只能被 User 角色访问，再通过 AuthGuards 判断用户身份是否合法，通过 RoleGuards 来判断用户的角色是否可以访问该接口。在路由处理函数中判断下照片列表的类型和长度，最终调用 service 层创建照片。

​	对于照片列表字段，需要遍历文件列表，把文件名称中的图片大小解析出来，解析成一个对象 ，保存在数据库中，这样方便前端直接获取图片尺寸。

```json
{
	"src":string,
    "width":number,
    "height":number
}
```

##### 审核照片

 用户发布的照片需要被审核才能被公开显示出来。通过 SetMetaData 来设置路由元数据，设置该接口可以被哪些角色访问（Admin、SuperAdmin），通过 AuthGuard 拦截并解析 token，通过 RoleGuard 来拦截非法的角色访问接口，通过管道解析 token、解析路径参数、解析校验请求体数据，最终调用 service 层。

##### 浏览照片列表(中间件解析token ，写得太炸裂了，代码太耦合了)

​	根据角色和status来控制不同角色能够查看的内容是不一样的。若是角色User，则只能查看**自己全部状态的作品**和**他人已经审核通过的作品**，若是未登录用户则**只能查看他人已经审核通过的作品**，管理员和超级管理员可以**查看所有状态的作品。**若浏览的不是User角色的照片，提示未找到的信息，因为只有User才能发送照片。

​	若status为undefined（访问该用户的所有照片），则只有超级管理员和管理员才能访问，若是User，必须是查看自己的照片才能访问。

​	若调用该接口的是User角色且status=1，还需要查询当前每个照片被点赞的状态，以及点赞数量。

##### 点赞照片

​	参数装饰器解析路径参数pid，下发给服务层，**注意，只有审核通过的照片才能被点赞!!!**

##### 取消点赞照片

​	参数装饰器解析路径参数pid，下发给服务层,注意，**只有审核通过的照片才能被取消点赞!!!**

##### 管理员获取照片列表

​	管理员才能调用该接口，获取用户的照片列表，通过uid、status来指定获取某个用户、某个状态的照片列表。

##### User获取照片列表

​	User才能调用该接口，User自身可以查看自己所有状态照片，查看别人的照片只能查看审核通过的，未登录只能查看别人审核通过的照片

##### User查看喜欢的照片

???

##### User发布照片的评论

**注意，只有审核通过的照片才能被评论!!**

User点赞评论



User取消点赞评论



##### User浏览照片上报

​	User浏览照片时可以上报数据，增加照片的浏览量。注意，只有审核通过的才能被上报

#### 4.服务层

##### 创建照片

 创建照片，直接插入记录

##### 审核照片

 审核照片前，需要检查当前照片是否被审核过了，未被审核则将当前审核信息记录在表中。

##### 浏览用户发送的照片列表（废弃）

​	该接口所有角色都能访问，不过不同角色可以访问的数据也是不同的。

未登录用户：只能查看他人审核发布的照片

登录用户：只能查看自己所有的照片，以及查看他人审核发布的照片

管理员以及超级管理员：查看所有人的照片

##### 点赞照片

​	点赞照片前先查询照片是否存在，用户是否已经点过赞了。

##### 取消点赞照片

​	取消点赞照片前先查询照片是否存在，用户是否点过赞了。

##### 管理员获取照片列表

​	根据起始偏移量、长度、查询条件获取数据，返回给控制层

##### User和未登录用户获取照片

​	若User访问自己的照片允许；User、游客只能访问别人审核通过的照片

#### 5.模块

```ts
import { Module } from "@nestjs/common";
import { photoProvider } from "./photo.provider";
import { PhotoService } from "./photo.service";
import { PhotoController } from "./photo.controller";

@Module({
  providers: [...photoProvider, PhotoService],
  controllers: [PhotoController],
})
export class PhotoModule {}
```

### 六、文件模块

文件上传通过Nest集成的Multer库来完成

```ts
import { MulterModule } from '@nestjs/platform-express'
```

#### 1.照片上传

​	上传的照片不保存在数据库中，保存到本地磁盘中，再通过中间件挂载照片资源。上传照片成功后返回资源地址。在上传图片时，需要把图片尺寸也保持到文件名称当中，方便前端处理图片。

```ts
import { Controller, ParseFilePipe, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { FileUploadPhotoDto } from "./dto/file-upload-photo.dto";
import crypto from 'crypto'
import path from 'path'
import fs from 'fs'
import sizeOf from 'image-size'

@Controller('file')
export class FileController {
  /**
   * 上传单图片
   */
  @UseInterceptors(FileInterceptor('photo'))
  @Post('/upload/photo')
  async uploadPhoto(@UploadedFile(ParseFilePipe) fileUploadPhotoDto: FileUploadPhotoDto) {
    // 静态资源根路径
    const rootPath = path.resolve('./src/static')

    // 校验静态资源文件是否存在
    // 图片路径
    const imgPath = path.resolve(rootPath, './img')
    const rootFlag = fs.existsSync(rootPath)
    if (!rootFlag) {
      // 不存在根路径 
      // 创建根路径文件夹
      fs.mkdirSync(rootPath)
      // 创建img文件夹
      fs.mkdirSync(imgPath)
    } else {
      // 存在根路径
      const imgFlag = fs.existsSync(imgPath)
      if (!imgFlag) {
        // 不存在img路径
        fs.mkdirSync(imgPath)
      }
    }
    // 读取该图片的尺寸大小
    const { height, width } = sizeOf(fileUploadPhotoDto.buffer)
    // 生成新文件名称
    const newName = `${crypto.randomUUID({ disableEntropyCache: true })}_w${width}_h${height}_${fileUploadPhotoDto.originalname}`
    // 新文件路径
    const filePath = path.resolve(imgPath, `./${newName}`)
    // 保存文件
    await new Promise<void>((resolve, reject) => {

      // 创建文件流
      const writeStream = fs.createWriteStream(filePath)
      // 写入数据
      writeStream.write(fileUploadPhotoDto.buffer, (err) => {
        // 本次写入是否成功?
        if (err) {
          reject()
        } else {
          resolve()
        }
      })

    })

    // 返回图片链接地址
    return `/static/img/${newName}`
  }
}
```



#### 5.模块



### 加密

数据库中某些字段需要加密，比如用户密码，不适合明文显示在数据库中。

安装依赖

```shell
pnpm add crypto-js
```

封装加密解密函数

```ts
const Crypto = require("crypto-js");

export const SECRET_KEY = "****";

/**
 * AES对称加密
 * @param content 明文
 * @param key 密钥
 * @returns 加密结果
 */
export const encrpty = (content: string, key: string) => {
  return Crypto.AES.encrypt(content, key).toString();
};

/**
 * AES解密
 * @param encrptyStr 密文
 * @param key 密钥
 * @returns 解密内容
 */
export const decrpty = (encrptyStr: string, key: string) => {
  return Crypto.AES.decrypt(encrptyStr, key).toString(Crypto.enc.Utf8);
};
```
