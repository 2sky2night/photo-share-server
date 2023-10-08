import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from "@nestjs/common";
import {
  SearchPhotoController,
  SearchCommentController,
  SearchUserController,
} from "./controller";
import { PhotoModule } from "..";
import { TokenParseMiddleware } from "../../common/middleware";
import {
  SearchPhotoService,
  SearchCommentService,
  SearchUserService,
} from "./service";

@Module({
  imports: [PhotoModule],
  controllers: [
    SearchPhotoController,
    SearchCommentController,
    SearchUserController,
  ],
  providers: [SearchPhotoService, SearchCommentService, SearchUserService],
})
export class SearchModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // 中间件解析token,让登录和未登录用户呈现不同内容。
    consumer.apply(TokenParseMiddleware).forRoutes(
      {
        path: "/search/photo/user",
        method: RequestMethod.GET,
      },
      {
        path: "/search/comment",
        method: RequestMethod.GET,
      }
    );
  }
}
