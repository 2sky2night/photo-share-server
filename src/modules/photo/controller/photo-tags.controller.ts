import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { PhotoTagsService } from "../service";
import { IntPipe, ValidationPipe } from "../../../common/pipe";
import { TagsAlterDto, TagsCreateDto } from "../dto";
import { Role, Token } from "../../../common/decorator";
import { Roles } from "../../../modules/auth/role";
import { AuthGuard, RoleGuard } from "../../../common/guard";
import tips from "../../../common/tips";

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
}
