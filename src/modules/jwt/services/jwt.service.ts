import { Injectable } from "@nestjs/common";
import { REFRESH_TOKEN_TIME } from "../../../config";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class JWTService {
  constructor(
    // 注入jwt
    private interalService: JwtService
  ) {}
  /**
   * 生成短期token
   * @param sub 用户凭证
   * @returns
   */
  signAccessToken(sub: number) {
    return this.interalService.signAsync({
      sub,
    });
  }
  /**
   * 生成长期token
   * @param sub 用户凭证
   * @returns
   */
  signRefreshToken(sub: number) {
    return this.interalService.signAsync(
      {
        sub,
      },
      {
        expiresIn: REFRESH_TOKEN_TIME,
      }
    );
  }
}
