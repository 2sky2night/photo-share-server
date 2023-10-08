import {
  MiddlewareConsumer,
  Module,
  NestModule,
  Req,
  RequestMethod,
} from "@nestjs/common";
import { photoProvider } from "./photo.provider";
import {
  PhotoController,
  UserLikePhotoController,
  UserCommentPhotoController,
  PhotoEventsController,
} from "./controller";
import { UserModule } from "../user/user.module";
import {
  PhotoService,
  UserCommentPhotoService,
  UserLikePhotoService,
} from "./service";
import { TokenParseMiddleware } from "../../common/middleware";

@Module({
  imports: [UserModule],
  providers: [
    ...photoProvider,
    PhotoService,
    UserLikePhotoService,
    UserCommentPhotoService,
  ],
  controllers: [
    PhotoController,
    UserLikePhotoController,
    UserCommentPhotoController,
    PhotoEventsController,
  ],
  exports: [PhotoService, UserCommentPhotoService, UserModule],
})
export class PhotoModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TokenParseMiddleware).forRoutes(
      {
        path: "/photo/list/:uid",
        method: RequestMethod.GET,
      },
      {
        path: "/photo/comment/list",
        method: RequestMethod.GET,
      },
      {
        path: "/photo/:pid",
        method: RequestMethod.GET,
      },
      {
        path: "/photo/like/list/:uid",
        method: RequestMethod.GET,
      }
    );
  }
}
