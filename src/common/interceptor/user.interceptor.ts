import { CallHandler, ExecutionContext, ForbiddenException, NestInterceptor, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";
import { Observable } from "rxjs";
import { JWT_SECRET } from "../../config";
import { TokenData } from "../../types/token";
import { User } from "../../modules/user/model/user.model";
import { Roles } from "../../modules/auth/role";
import tips from "../tips";

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
        throw new UnauthorizedException(error.toString ? error.toString() : tips.tokenError)
      }
    } else {
      return next.handle()
    }
  }
  async checkUser(uid: number) {
    const user = await this.userModel.findByPk(uid)
    if (user === null) {
      throw new UnauthorizedException(tips.noExist('用户'))
    } else {
      if (user.role !== Roles.User) {
        throw new ForbiddenException(tips.forbiddenError)
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
        throw new UnauthorizedException(tips.tokenError)
      }
    }
  }
}