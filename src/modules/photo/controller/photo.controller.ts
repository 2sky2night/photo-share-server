import {
  Controller,
  Post,
  Body,
  UseGuards,
  BadRequestException,
  Param,
  ParseIntPipe,
  Get,
  Query,
  Req,
  UseInterceptors,
  Res,
} from "@nestjs/common";
import { Response as ResType, query } from "express";
import { Response } from "../../../common/response";
import {
  LimitPipe,
  OffsetPipe,
  IntOptionalPipe,
  UserOptionalPipe,
  ValidationPipe,
  PhotoPipe,
  DescPipe,
  NumListPipe,
  StatusPipe,
  IntPipe,
} from "../../../common/pipe";
import { PhotoService } from "../service";
import { PhotoCreateDto, PhotoAuditDto } from "../dto";
import { AuthGuard, RoleGuard } from "../../../common/guard";
import { Roles } from "../../auth/role";
import { Token, Role, TokenOptional } from "../../../common/decorator";
import { UserInterceptor } from "../../../common/interceptor";
import type { AuditStatus } from "../../../types/photo";
import type { TokenData } from "../../../types/token";
import type { Request } from "express";

@Controller("photo")
export class PhotoController {
  constructor(private photoService: PhotoService) {}
  /**
   * 发布照片
   * @param uid 发布照片的id
   * @param photoCreateDto 请求体
   */
  @Role(Roles.User)
  @UseGuards(AuthGuard, RoleGuard)
  @Post("create")
  async createPhoto(
    @Token("sub") uid: number,
    @Body(new ValidationPipe()) photoCreateDto: PhotoCreateDto
  ) {
    const { photos } = photoCreateDto;
    if (photos.some((url) => typeof url !== "string")) {
      throw new BadRequestException("照片项的url必须是一个字符串!");
    }
    if (photos.length > 10) {
      throw new BadRequestException("每次最多分享10张照片!");
    }
    // 解析photot字段，将图片尺寸解析出来，这样前端方便读取图片尺寸
    const photosForm = photoCreateDto.photos.map((url) => {
      const [_hash, w, h] = url.split("_");
      if (w === undefined || h === undefined) {
        throw new BadRequestException("图片链接不合法!");
      }
      const width = +w.substring(1);
      const height = +h.substring(1);
      if (isNaN(width) || isNaN(height)) {
        throw new BadRequestException("图片链接不合法!");
      }
      return {
        width,
        height,
        url,
      };
    });

    return await this.photoService.create(uid, {
      title: photoCreateDto.title,
      content: photoCreateDto.content,
      photos: photosForm,
    });
  }
  /**
   * 审核照片
   * @param pid 照片id
   * @param uid 审核员id
   * @param photoAuditDto 审核状态
   */
  @Role(Roles.Admin, Roles.SuperAdmin)
  @UseGuards(AuthGuard, RoleGuard)
  @Post("audit/:pid")
  async auditPhoto(
    @Param("pid", new IntPipe("pid")) pid: number,
    @Token("sub") uid: number,
    @Body(new ValidationPipe()) photoAuditDto: PhotoAuditDto
  ) {
    await this.photoService.auditPhoto(pid, uid, photoAuditDto);
    return null;
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
  @Get("list/:uid")
  async getUserPhotos(
    @Req() requset: Request,
    @Param("uid", new IntPipe("uid")) uid: number,
    @Query("offset", OffsetPipe) offset: number,
    @Query("limit", LimitPipe) limit: number,
    @Query("status", StatusPipe) status: AuditStatus | undefined
  ) {
    // @ts-ignore
    const token = requset.user as TokenData;
    return this.photoService.findAuthorPhotos(
      uid,
      offset,
      limit,
      status,
      token === undefined ? undefined : token.sub
    );
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
  @Get("admin/list")
  async adminFindPhotos(
    @Query("uid", IntOptionalPipe, UserOptionalPipe) uid: number | undefined,
    @Query("offset", OffsetPipe) offset: number,
    @Query("limit", LimitPipe) limit: number,
    @Query("status", StatusPipe) status: AuditStatus | undefined,
    @Query("desc", DescPipe) desc: boolean
  ) {
    return await this.photoService.adminFindPhotos(
      uid,
      status,
      offset,
      limit,
      desc
    );
  }
  /**
   * 用户获取照片
   * @param currentUid
   * @param uid
   * @param status
   * @param offset
   * @param limit
   * @returns
   */
  @UseInterceptors(UserInterceptor)
  @Get("user/list")
  async userFindPhotos(
    @TokenOptional("sub") currentUid: number | undefined,
    @Query("uid", IntOptionalPipe, UserOptionalPipe) uid: number | undefined,
    @Query("status", StatusPipe) status: AuditStatus | undefined,
    @Query("offset", OffsetPipe) offset: number,
    @Query("limit", LimitPipe) limit: number,
    @Query("desc", DescPipe) desc: boolean
  ) {
    return await this.photoService.userFindPhotos(
      uid,
      status,
      offset,
      limit,
      currentUid,
      desc
    );
  }
  /**
   * 上报照片浏览量
   * @param pid
   * @returns
   */
  @Post("view/:pid")
  async viewPhoto(@Param("pid", PhotoPipe) pid: number) {
    await this.photoService.viewPhoto(pid);
    return null;
  }
  // 随机获取审核通过的照片的图片
  @Get("random/pic")
  async randomImgList(
    @Query("limit", LimitPipe) limit: number,
    @Res() res: ResType
  ) {
    // 由于图片数量多，走缓存，缓存一天
    res.header("Cache-Control", "max-age=86400");
    const data = await this.photoService.randomImgList(limit);
    const response = new Response(data);
    res.send(response);
  }
  // 获取某个照片
  // 管理员随意读取
  // 用户非作者只能读取审核通过的
  // 用户作者可以随意读取
  @Get(":pid")
  async getPhoto(
    @Param("pid", PhotoPipe) pid: number,
    @TokenOptional("sub") uid: number
  ) {
    return await this.photoService.getPhoto(pid, uid);
  }
  // 根据pid列表获取某些照片
  @Get("/pids/list")
  async getPhotos(
    @TokenOptional("sub") uid: number,
    @Query("pids", NumListPipe) pids: number[]
  ) {
    return await this.photoService.getPhotos(pids, uid);
  }
  // 获取照片简要信息(所有的照片)
  @Role(Roles.Admin, Roles.SuperAdmin)
  @UseGuards(AuthGuard, RoleGuard)
  @Get("all/briefly")
  async getPhotosBriefly(
    @Query("limit", LimitPipe) limit: number,
    @Query("offset", OffsetPipe) offset: number,
    @Query("desc", DescPipe) desc: boolean
  ) {
    return await this.photoService.getPhotoList(limit, offset, desc);
  }
}
