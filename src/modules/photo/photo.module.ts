import { MiddlewareConsumer, Module, NestModule, RequestMethod } from "@nestjs/common";
import { photoProvider } from "./photo.provider";
import { PhotoController, UserLikePhotoController } from "./controller";
import { UserModule } from "../user/user.module";
import { PhotoService } from './service'
import { TokenParseMiddleware } from "../../common/middleware";
import { UserLikePhotoService } from "./service/user-like-photo.service";

@Module({
  imports: [
    UserModule
  ],
  providers: [
    ...photoProvider,
    PhotoService,
    UserLikePhotoService,
  ],
  controllers: [
    PhotoController,
    UserLikePhotoController
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