import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from "@nestjs/common";
import { photoProvider } from "./photo.provider";
import {
  PhotoController,
  UserLikePhotoController,
  UserCommentPhotoController,
  PhotoEventsController,
  PhotoTagsController,
} from "./controller";
// 不要向/src/module/index.ts中引入UserModule，因为这个文件中有个模块DataBaseModule？会导致循环引用
import { UserModule } from "../user/user.module";
import {
  PhotoService,
  UserCommentPhotoService,
  UserLikePhotoService,
  PhotoTagsService,
} from "./service";
import { TokenParseMiddleware } from "../../common/middleware";

@Module({
  imports: [UserModule],
  providers: [
    ...photoProvider,
    PhotoService,
    UserLikePhotoService,
    UserCommentPhotoService,
    PhotoTagsService,
  ],
  controllers: [
    PhotoController,
    UserLikePhotoController,
    UserCommentPhotoController,
    PhotoEventsController,
    PhotoTagsController,
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
