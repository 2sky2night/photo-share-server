import { NestMiddleware, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request, Response } from "express";
import { JWT_SECRET } from "../../config";
import { TokenData } from "../../types/token";

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
        const playload = await this.jwtService.verifyAsync<TokenData>(token, { secret: JWT_SECRET })
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