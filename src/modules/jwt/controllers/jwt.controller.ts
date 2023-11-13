import { Controller, UseGuards, Get } from "@nestjs/common";
import { JWTService } from "../services";
import { Token } from "../../../common/decorator";
import { AuthGuard } from "../../../common/guard";

@Controller("jwt")
export class JWTController {
  constructor(private jWTService: JWTService) {}
  /**
   * 刷新短期token
   * @param uid
   */
  @UseGuards(AuthGuard)
  @Get("refresh")
  async refreshToken(@Token("sub") uid: number) {
    return await this.jWTService.signAccessToken(uid);
  }
}
