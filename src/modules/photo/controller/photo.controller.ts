import { Controller, Post, Body, UseGuards, BadRequestException, Param, ParseIntPipe, Get, Query, Req, Optional, UseInterceptors } from "@nestjs/common";
import { LimitPipe, OffsetPipe, IntOptionalPipe, UserOptionalPipe, ValidationPipe } from "../../../common/pipe";
import { PhotoCreateDto } from "../dto/photo-create.dto";
import { AuthGuard, RoleGuard } from "../../../common/guard";
import { Roles } from "../../auth/role";
import { Token, Role, TokenOptional } from "../../../common/decorator";
import { PhotoService } from "../service/photo.service";
import { PhotoAuditDto } from "../dto/photo-audit.dto";
import { AuditStatus } from "../../../types/photo";
import { StatusPipe } from "../../../common/pipe/status.pipe";
import { TokenData } from "../../../types/token";
import { Request } from "express";
import { UserInterceptor } from "../../../common/interceptor";

@Controller('photo')
export class PhotoController {
  constructor(
    private photoService: PhotoService
  ) { }
  /**
   * 发布照片
   * @param uid 发布照片的id 
   * @param photoCreateDto 请求体
   */
  @Role(Roles.User)
  @UseGuards(AuthGuard, RoleGuard)
  @Post('create')
  async createPhoto(@Token('sub') uid: number, @Body(new ValidationPipe()) photoCreateDto: PhotoCreateDto) {
    const { photos } = photoCreateDto
    if (photos.some(url => typeof url !== 'string')) {
      throw new BadRequestException('照片项的url必须是一个字符串!')
    }
    if (photos.length > 10) {
      throw new BadRequestException('每次最多分享10张照片!')
    }
    // 解析photot字段，将图片尺寸解析出来，这样前端方便读取图片尺寸
    const photosForm = photoCreateDto.photos.map(url => {
      const [_hash, w, h] = url.split('_')
      if (w === undefined || h === undefined) {
        throw new BadRequestException('图片链接不合法!')
      }
      const width = +(w.substring(1))
      const height = +(h.substring(1))
      if (isNaN(width) || isNaN(height)) {
        throw new BadRequestException('图片链接不合法!')
      }
      return {
        width,
        height,
        url,
      }
    })

    return await this.photoService.create(uid, {
      title: photoCreateDto.title,
      content: photoCreateDto.content,
      photos: photosForm
    })
  }
  /**
   * 审核照片
   * @param pid 照片id 
   * @param uid 审核员id
   * @param photoAuditDto 审核状态 
   */
  @Role(Roles.Admin, Roles.SuperAdmin)
  @UseGuards(AuthGuard, RoleGuard)
  @Post('audit/:pid')
  async auditPhoto(
    @Param('pid', ParseIntPipe) pid: number,
    @Token('sub') uid: number,
    @Body(new ValidationPipe()) photoAuditDto: PhotoAuditDto) {
    await this.photoService.auditPhoto(pid, uid, photoAuditDto)
    return '审核成功!'
  }
  /**
   * 获取用户的照片列表
   * 
   * 1.status:未通过2和未审核0只有admin、superadmin和作者本身才能调用
   * 2.若调用接口的用户为User
   *    若查看自己的作品则全部状态的都可以看
   *    若查看他人的作品则只能查看审核通过的status=1
   * 3.若为未登录用户，则只能查看其他用户发布的作品
   * @param uid 作者id
   * @param offset 偏移量
   * @param limit 获取多少数据
   * @param status 审核状态
   * @returns 
   */
  @Get('list/:uid')
  async getUserPhotos(
    @Req() requset: Request,
    @Param('uid', ParseIntPipe) uid: number,
    @Query('offset', OffsetPipe) offset: number,
    @Query('limit', LimitPipe) limit: number,
    @Query('status', StatusPipe) status: AuditStatus | undefined
  ) {
    // @ts-ignore
    const token = requset.user as TokenData
    return this.photoService.findAuthorPhotos(uid, offset, limit, status, token === undefined ? undefined : token.sub)
  }
  /**
   * 管理员获取照片
   * @param uid 用户id
   * @param offset 偏移量
   * @param limit 总数
   * @param status 状态
   * @returns 
   */
  @Role(Roles.Admin, Roles.SuperAdmin)
  @UseGuards(AuthGuard, RoleGuard)
  @Get('admin/list')
  async adminFindPhotos(
    @Query('uid', IntOptionalPipe, UserOptionalPipe) uid: number | undefined,
    @Query('offset', OffsetPipe) offset: number,
    @Query('limit', LimitPipe) limit: number,
    @Query('status', StatusPipe) status: AuditStatus | undefined
  ) {
    return await this.photoService.adminFindPhotos(uid, status, offset, limit)
  }
  @UseInterceptors(UserInterceptor)
  @Get('user/list')
  async userFindPhotos(
    @TokenOptional('sub') currentUid: number | undefined,
    @Query('uid', IntOptionalPipe, UserOptionalPipe) uid: number | undefined,
    @Query('status', StatusPipe) status: AuditStatus | undefined,
    @Query('offset', OffsetPipe) offset: number,
    @Query('limit', LimitPipe) limit: number,
  ) {
    return await this.photoService.userFindPhotos(uid, status, offset, limit, currentUid)
  }
}
