import {
  Controller,
  DefaultValuePipe,
  Get,
  Query,
  UseGuards,
} from "@nestjs/common";
import { Role, TokenOptional } from "../../../common/decorator";
import {
  DescPipe,
  LimitPipe,
  OffsetPipe,
  StatusPipe,
} from "../../../common/pipe";
import { AuditStatus } from "../../../types/photo";
import { SearchPhotoService } from "../service";
import { AuthGuard, RoleGuard } from "../../../common/guard";
import { Roles } from "../../auth/role";

@Controller("search/photo")
export class SearchPhotoController {
  constructor(private searchPhotoService: SearchPhotoService) {}
  // User搜索照片接口
  @Get("/user")
  async userSearchPhoto(
    @TokenOptional("sub") currentUid: number | undefined,
    @Query("keywords", new DefaultValuePipe("")) keywords: string,
    @Query("limit", LimitPipe) limit: number,
    @Query("offset", OffsetPipe) offset: number,
    @Query("desc", DescPipe) desc: boolean
  ) {
    return await this.searchPhotoService.userSearchPhoto(
      currentUid,
      keywords,
      offset,
      limit,
      desc
    );
  }
  // 管理员搜索照片接口
  @Role(Roles.SuperAdmin, Roles.Admin)
  @UseGuards(AuthGuard, RoleGuard)
  @Get("")
  async searchPhoto(
    @Query("keywords", new DefaultValuePipe("")) keywords: string,
    @Query("limit", LimitPipe) limit: number,
    @Query("offset", OffsetPipe) offset: number,
    @Query("desc", DescPipe) desc: boolean,
    @Query("status", StatusPipe) status: AuditStatus | undefined
  ) {
    return await this.searchPhotoService.searchPhoto(
      keywords,
      offset,
      limit,
      desc,
      status
    );
  }
}
