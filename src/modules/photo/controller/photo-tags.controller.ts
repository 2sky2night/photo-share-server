import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { PhotoTagsService } from "../service";
import {
  DescPipe,
  IntPipe,
  LimitPipe,
  OffsetPipe,
  ValidationPipe,
} from "../../../common/pipe";
import { TagsAlterDto, TagsCreateDto } from "../dto";
import { Role, Token } from "../../../common/decorator";
import { Roles } from "../../../modules/auth/role";
import { AuthGuard, RoleGuard } from "../../../common/guard";

@Controller("/photo/tags")
export class PhotoTagsController {
  constructor(
    /**
     * 照片标签服务层
     */
    private PTService: PhotoTagsService
  ) {}
  /**
   * 创建标签
   */
  @Role(Roles.Admin, Roles.SuperAdmin)
  @UseGuards(AuthGuard, RoleGuard)
  @Post("create")
  async create(
    @Token("sub") uid: number,
    @Body(new ValidationPipe()) tagsCreateDto: TagsCreateDto
  ) {
    await this.PTService.create(
      uid,
      tagsCreateDto.nameZH,
      tagsCreateDto.nameEN,
      tagsCreateDto.descriptionZH,
      tagsCreateDto.descriptionEN
    );
    return null;
  }
  /**
   * 删除标签
   */
  @Role(Roles.Admin, Roles.SuperAdmin)
  @UseGuards(AuthGuard, RoleGuard)
  @Delete("/:tid")
  async delete(
    @Param("tid", new IntPipe("tid"))
    tid: number
  ) {
    await this.PTService.delete(tid);
    return null;
  }
  /**
   * 修改标签
   */
  @Role(Roles.Admin, Roles.SuperAdmin)
  @UseGuards(AuthGuard, RoleGuard)
  @Put("/:tid")
  async alter(
    @Param("tid", new IntPipe("tid")) tid: number,
    @Body() tagsAlterDto: TagsAlterDto
  ) {
    await this.PTService.alter(tid, tagsAlterDto);
    return null;
  }
  /**
   * 管理员获取标签
   */
  @Role(Roles.Admin, Roles.SuperAdmin)
  @UseGuards(AuthGuard, RoleGuard)
  @Get("list")
  async list(
    @Query("limit", LimitPipe) limit: number,
    @Query("offset", OffsetPipe) offset: number,
    @Query("desc", DescPipe) desc: boolean,
    @Query("creator_uid", new IntPipe("creator_uid", true))
    creator_uid: number | undefined
  ) {
    return await this.PTService.list(limit, offset, desc, creator_uid);
  }
  /**
   * 获取标签
   * @param limit 长度 
   * @param offset 偏移量
   * @param desc 是否降序
   * @returns 
   */
  @Get("/all")
  async userGetList(
    @Query("limit", LimitPipe) limit: number,
    @Query("offset", OffsetPipe) offset: number,
    @Query("desc", DescPipe) desc: boolean
  ) {
    return await this.PTService.userGetList(limit,offset,desc)
  }
}
