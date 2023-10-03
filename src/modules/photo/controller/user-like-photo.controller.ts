import {
  Controller,
  UseGuards,
  Post,
  Param,
  Delete,
  Get,
  Query,
} from "@nestjs/common";
import { UserLikePhotoService } from "../service/user-like-photo.service";
import { AuthGuard, RoleGuard } from "../../../common/guard";
import { Token, TokenOptional } from "../../../common/decorator";
import { Role } from "../../../common/decorator/role.decorator";
import { Roles } from "../../auth/role";
import {
  DescPipe,
  LimitPipe,
  OffsetPipe,
  PhotoPassPipe,
  UserPipe,
} from "../../../common/pipe";
import { PhotoService } from "../service";

@Controller("/photo/like")
export class UserLikePhotoController {
  constructor(
    private photoService: PhotoService,
    private userLikePhotoService: UserLikePhotoService
  ) {}
  // 点赞
  @Role(Roles.User)
  @UseGuards(AuthGuard, RoleGuard)
  @Post(":pid")
  async like(
    @Param("pid", PhotoPassPipe) pid: number,
    @Token("sub") uid: number
  ) {
    await this.userLikePhotoService.create(uid, pid);
    return null;
  }
  // 取消点赞
  @Role(Roles.User)
  @UseGuards(AuthGuard, RoleGuard)
  @Delete(":pid")
  async cancelLike(
    @Param("pid", PhotoPassPipe) pid: number,
    @Token("sub") uid: number
  ) {
    await this.userLikePhotoService.delete(uid, pid);
    return null;
  }
  // 获取用户点赞的照片列表
  @Get("/list/:uid")
  async getUserLikePhotoList(
    @TokenOptional("sub") currentUid: number | undefined,
    @Query("limit", LimitPipe) limit: number,
    @Query("offset", OffsetPipe) offset: number,
    @Query("desc", DescPipe) desc: boolean,
    @Param("uid", UserPipe) uid: number
  ) {
    return await this.userLikePhotoService.getUserLikePhotoList(
      uid,
      currentUid,
      limit,
      offset,
      desc
    );
  }
}
