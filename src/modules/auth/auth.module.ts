import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from "@nestjs/common";
import { UserModule } from "../user/user.module";
import { JWTModule } from "../jwt/jwt.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { TokenParseMiddleware } from "../../common/middleware";

@Module({
  imports: [UserModule, JWTModule],
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
