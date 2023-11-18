import { Controller, Get, Query } from "@nestjs/common";
import { DataService } from "../services";
import { IntPipe } from "../../../common/pipe";

@Controller("data")
export class DataController {
  constructor(readonly dataService: DataService) {}
  /**
   * 总数据
   */
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
  @Get("/tags/photoCount")
  async tagsPhotoCount(
    @Query("limit", new IntPipe("limit", true, true)) limit: number | undefined
  ) {
    return await this.dataService.tagsPhotoCount(limit);
  }

  /**
   * 统计各照片的照片浏览量
   */
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
  @Get("/photo/audit/portion")
  async auditPhotoPortion(
    @Query("days", new IntPipe("days", true, true))
    days: number | undefined
  ) {
    return await this.dataService.auditPhotoPortion(days);
  }
}
