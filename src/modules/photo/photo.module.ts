import { MiddlewareConsumer, Module, NestModule, RequestMethod } from "@nestjs/common";
import { photoProvider } from "./photo.provider";
import { PhotoService } from "./photo.service";
import { PhotoController } from "./photo.controller";
import { UserModule } from "../user/user.module";
import { TokenParseMiddleware } from "../../common/middleware";

@Module({
  imports: [
    UserModule
  ],
  providers: [
    ...photoProvider,
    PhotoService
  ],
  controllers: [
    PhotoController
  ]
})
export class PhotoModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(
      TokenParseMiddleware
    ).forRoutes(
      {
        path: '/photo/list/:uid',
        method: RequestMethod.GET
      }
    )
  }
}