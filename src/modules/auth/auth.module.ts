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
        expiresIn: '2h'
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