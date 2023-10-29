import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard, RoleGuard } from "../../../common/guard";
import { Role, Token, TokenOptional } from "../../../common/decorator";
import { Roles } from "../../auth/role";
import {
  BooleanOptionPipe,
  CommentPipe,
  DescPipe,
  IntOptionalPipe,
  IntPipe,
  LimitPipe,
  OffsetPipe,
  PhotoPassPipe,
  ValidationPipe,
} from "../../../common/pipe";
import { CommentCreateDto } from "../dto";
import { UserCommentPhotoService } from "../service";

@Controller("/photo/comment")
export class UserCommentPhotoController {
  constructor(
    /**
     * 用户评论照片服务层
     */
    private UCPService: UserCommentPhotoService
  ) {}
  @Role(Roles.User)
  @UseGuards(AuthGuard, RoleGuard)
  @Post("create/:pid")
  // 发送评论
  async createComment(
    @Param("pid", PhotoPassPipe) pid: number,
    @Token("sub") uid: number,
    @Body(new ValidationPipe()) commentCreateDto: CommentCreateDto
  ) {
    return await this.UCPService.createComment(uid, pid, commentCreateDto);
  }
  // 点赞评论
  @Role(Roles.User)
  @UseGuards(AuthGuard, RoleGuard)
  @Post("like/:cid")
  async createLike(
    @Token("sub") uid: number,
    @Param("cid", CommentPipe) cid: number
  ) {
    await this.UCPService.createLike(uid, cid);
    return null;
  }
  // 取消点赞评论
  @Role(Roles.User)
  @UseGuards(AuthGuard, RoleGuard)
  @Delete("like/:cid")
  async removeLike(
    @Token("sub") uid: number,
    @Param("cid", CommentPipe) cid: number
  ) {
    await this.UCPService.removeLike(uid, cid);
    return null;
  }
  // 获取评论列表
  @Get("list")
  async getComments(
    @TokenOptional("sub") uid: number | undefined,
    @Query("pid", PhotoPassPipe) pid: number,
    @Query("limit", LimitPipe) limit: number,
    @Query("offset", OffsetPipe) offset: number,
    @Query("desc", DescPipe) desc: boolean
  ) {
    return await this.UCPService.getComments(pid, offset, limit, uid, desc);
  }
  // 删除评论，非User角色才可以访问该接口
  @Role(Roles.Admin, Roles.SuperAdmin)
  @UseGuards(AuthGuard, RoleGuard)
  @Delete(":cid")
  async removeComment(@Param("cid", new IntPipe("cid")) cid: number) {
    await this.UCPService.removeComment(cid);
    return null;
  }
  // 恢复评论
  @Role(Roles.SuperAdmin, Roles.Admin)
  @UseGuards(AuthGuard, RoleGuard)
  @Post("restore/:cid")
  async restoreComment(@Param("cid", new IntPipe("cid")) cid: number) {
    await this.UCPService.restoreComment(cid);
    return null;
  }
  // 获取评论列表
  @Role(Roles.SuperAdmin, Roles.Admin)
  @UseGuards(AuthGuard, RoleGuard)
  @Get("all")
  async adminGetComments(
    @Query("uid", IntOptionalPipe) uid: number | undefined,
    @Query("pid", IntOptionalPipe) pid: number | undefined,
    @Query("isDele", BooleanOptionPipe)
    isDele: boolean | undefined,
    @Query("keywords") keywords: string | undefined,
    @Query("limit", LimitPipe) limit: number,
    @Query("offset", OffsetPipe) offset: number,
    @Query("desc", DescPipe) desc: boolean
  ) {
    return await this.UCPService.adminGetComment(
      keywords,
      pid,
      uid,
      isDele,
      limit,
      offset,
      desc
    );
  }
  // 获取某个评论(管理员调用)
  @Role(Roles.SuperAdmin, Roles.Admin)
  @UseGuards(AuthGuard, RoleGuard)
  @Get(":cid")
  async adminGetComment(@Param("cid", new IntPipe("cid")) cid: number) {
    return await this.UCPService.getComment(cid);
  }
}
