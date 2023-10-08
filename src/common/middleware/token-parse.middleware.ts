import { NestMiddleware, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request, Response } from "express";
import { JWT_SECRET } from "../../config";
import { TokenData } from "../../types/token";
import { User } from "../../modules/user/model/user.model";

/**
 * 解析token的中间件
 */
export class TokenParseMiddleware implements NestMiddleware {
  jwtService: JwtService;
  userModel: typeof User;
  constructor() {
    this.jwtService = new JwtService();
    this.userModel = User;
  }
  async use(req: Request, _res: Response, next: (error?: any) => void) {
    const token = this.getToken(req);
    if (token) {
      // 有token，需要校验token
      try {
        const playload = await this.jwtService.verifyAsync<TokenData>(token, {
          secret: JWT_SECRET,
        });
        // 查询用户id是否有效
        await this.findUser(playload.sub);
        // @ts-ignore 将解析出来的数据保存到上下文中
        req.user = playload;
        next();
      } catch (error: any) {
        throw new UnauthorizedException(error.toString ? error.toString() : "");
      }
    } else {
      next();
    }
  }
  async findUser(uid: number) {
    const user = await this.userModel.findByPk(uid);
    if (user === null) {
      throw new UnauthorizedException("此id的用户不存在!");
    }
    return user;
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
