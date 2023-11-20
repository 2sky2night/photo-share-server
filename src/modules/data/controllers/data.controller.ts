import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { DataService } from "../services";
import { IntPipe } from "../../../common/pipe";
import { Role } from "../../../common/decorator";
import { Roles } from "../../../modules/auth/role";
import { AuthGuard, RoleGuard } from "../../../common/guard";
@Controller("data")
export class DataController {
  constructor(readonly dataService: DataService) {}
  /**
   * 总数据
   */
  @Role(Roles.Admin, Roles.SuperAdmin)
  @UseGuards(AuthGuard, RoleGuard)
  @Get("/")
  async overall(
    @Query("days", new IntPipe("days", true, true))
    days: number | undefined
  ) {
    return await this.dataService.overall(days);
  }
  /**
   * 获取各个标签下的照片统计数量
   */
  @Role(Roles.Admin, Roles.SuperAdmin)
  @UseGuards(AuthGuard, RoleGuard)
  @Get("/tags/photoCount")
  async tagsPhotoCount(
    @Query("days", new IntPipe("days", true, true))
    days: number | undefined,
    @Query("limit", new IntPipe("limit", true, true)) limit: number | undefined
  ) {
    return await this.dataService.tagsPhotoCount(days, limit);
  }

  /**
   * 统计各照片的照片浏览量
   */
  @Role(Roles.Admin, Roles.SuperAdmin)
  @UseGuards(AuthGuard, RoleGuard)
  @Get("/photo/views")
  async photoViewsList(
    @Query("days", new IntPipe("days", true, true))
    days: number | undefined,
    @Query("limit", new IntPipe("limit", true, true)) limit: number | undefined
  ) {
    return await this.dataService.photoViewsList(days, limit);
  }

  /**
   * 获取账户各个角色的比例
   */
  @Role(Roles.Admin, Roles.SuperAdmin)
  @UseGuards(AuthGuard, RoleGuard)
  @Get("/account/portion")
  async accountPortion(
    @Query("days", new IntPipe("days", true, true))
    days: number | undefined
  ) {
    return await this.dataService.accountPortion(days);
  }

  /**
   * 统计各个用户发布照片的数量
   */
  @Role(Roles.Admin, Roles.SuperAdmin)
  @UseGuards(AuthGuard, RoleGuard)
  @Get("/user/photo")
  async userPostPhotoCount(
    @Query("days", new IntPipe("days", true, true))
    days: number | undefined,
    @Query("limit", new IntPipe("limit", true, true)) limit: number | undefined
  ) {
    return await this.dataService.userPostPhotoCount(days, limit);
  }

  /**
   * 统计照片审核状态比例
   */
  @Role(Roles.Admin, Roles.SuperAdmin)
  @UseGuards(AuthGuard, RoleGuard)
  @Get("/photo/audit/portion")
  async auditPhotoPortion(
    @Query("days", new IntPipe("days", true, true))
    days: number | undefined
  ) {
    return await this.dataService.auditPhotoPortion(days);
  }
}
