import { Controller, UseGuards, Post, Param, ParseIntPipe, Delete } from "@nestjs/common";
import { UserLikePhotoService } from "../service/user-like-photo.service";
import { AuthGuard, RoleGuard } from "../../../common/guard";
import { Token } from "../../../common/decorator";
import { Role } from "../../../common/decorator/role.decorator";
import { Roles } from "../../auth/role";

@Controller('/photo/like')
export class UserLikePhotoController {
  constructor(
    private userLikePhotoService: UserLikePhotoService
  ) { }
  // 点赞
  @Role(Roles.User)
  @UseGuards(AuthGuard, RoleGuard)
  @Post(':pid')
  async like(@Param('pid', ParseIntPipe) pid: number, @Token('sub') uid: number) {
    await this.userLikePhotoService.create(uid, pid)
    return null
  }
  // 取消点赞
  @Role(Roles.User)
  @UseGuards(AuthGuard, RoleGuard)
  @Delete(':pid')
  async cancelLike(@Param('pid', ParseIntPipe) pid: number, @Token('sub') uid: number) {
    await this.userLikePhotoService.delete(uid, pid)
    return null
  }
}