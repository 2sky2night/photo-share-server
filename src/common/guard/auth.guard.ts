import { CanActivate, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { Request } from "express";
import { JwtService } from "@nestjs/jwt";
import { JWT_SECRET } from "../../config";
import { TokenData } from "../../types/token";
import { User } from "../../modules/user/model/user.model";
import tips from "../tips";

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
    } catch (error: any) {
      throw new UnauthorizedException(error.toString ? error.toString() : tips.tokenError)
    }
  }
  // 查询用户是否存在
  async findUser(uid: number) {
    const user = await this.userModel.findByPk(uid)
    if (user === null) {
      throw new UnauthorizedException(tips.noExist('用户'))
    }
  }
  // 从请求头部获取token
  getToken(req: Request) {
    const authorization = req.headers.authorization
    if (authorization === undefined) {
      // 未携带token
      throw new UnauthorizedException(tips.tokenEmpty)
    } else {
      const [type, token] = authorization.split(' ')
      if (type === 'Bearer') {
        return token
      } else {
        // 非jwt类型的token或其他字符串
        throw new UnauthorizedException(tips.tokenError)
      }
    }
  }
}