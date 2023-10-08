import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { AuthGuard, RoleGuard } from "../../../common/guard";
import { Role, Token, TokenOptional } from "../../../common/decorator";
import { Roles } from "../../auth/role";
import { CommentPipe, DescPipe, LimitPipe, OffsetPipe, PhotoPassPipe, ValidationPipe } from "../../../common/pipe";
import { CommentCreateDto } from "../dto";
import { UserCommentPhotoService } from "../service";

@Controller('/photo/comment')
export class UserCommentPhotoController {
  constructor(
    /**
     * 用户评论照片服务层
     */
    private UCPService: UserCommentPhotoService
  ) { }
  @Role(Roles.User)
  @UseGuards(AuthGuard, RoleGuard)
  @Post('/:pid')
  // 发送评论
  async createComment(
    @Param('pid', PhotoPassPipe) pid: number,
    @Token('sub') uid: number,
    @Body(new ValidationPipe()) commentCreateDto: CommentCreateDto
  ) {
    return await this.UCPService.createComment(uid, pid, commentCreateDto)
  }
  // 点赞评论
  @Role(Roles.User)
  @UseGuards(AuthGuard, RoleGuard)
  @Post('like/:cid')
  async createLike(
    @Token('sub') uid: number,
    @Param('cid', CommentPipe) cid: number
  ) {
    await this.UCPService.createLike(uid, cid)
    return null
  }
  // 取消点赞评论
  @Role(Roles.User)
  @UseGuards(AuthGuard, RoleGuard)
  @Delete('like/:cid')
  async removeLike(
    @Token('sub') uid: number,
    @Param('cid', CommentPipe) cid: number
  ) {
    await this.UCPService.removeLike(uid, cid)
    return null
  }
  // 获取评论列表
  @Get('list')
  async getComments(
    @TokenOptional('sub') uid: number | undefined,
    @Query('pid', PhotoPassPipe) pid: number,
    @Query('limit', LimitPipe) limit: number,
    @Query('offset', OffsetPipe) offset: number,
    @Query('desc', DescPipe) desc: boolean
  ) {
    return await this.UCPService.getComments(pid, offset, limit, uid, desc)
  }
}