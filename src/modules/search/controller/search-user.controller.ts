import { Controller, DefaultValuePipe, Get, Query, UseGuards } from "@nestjs/common";
import { SearchUserService } from "../service";
import {
  DescPipe,
  LimitPipe,
  OffsetPipe,
  RolePipe,
} from "../../../common/pipe";
import { AuthGuard, RoleGuard } from "../../../common/guard";
import { Role } from "../../../common/decorator";
import { Roles } from "../../auth/role";

@Controller("search/account")
export class SearchUserController {
  constructor(private searchUserService: SearchUserService) {}
  // User搜索
  @Get("/user")
  async userSearch(
    @Query("keywords",new DefaultValuePipe('')) keywords: string,
    @Query("limit", LimitPipe) limit: number,
    @Query("offset", OffsetPipe) offset: number,
    @Query("desc", DescPipe) desc: boolean
  ) {
    return await this.searchUserService.userSearch(keywords, limit, offset, desc);
  }
  // 管理员搜索
  @Role(Roles.SuperAdmin)
  @UseGuards(AuthGuard, RoleGuard)
  @Get("")
  async adminSearch(
    @Query("keywords", new DefaultValuePipe('')) keywords: string,
    @Query("limit", LimitPipe) limit: number,
    @Query("offset", OffsetPipe) offset: number,
    @Query("desc", DescPipe) desc: boolean,
    @Query("role", RolePipe) role: Roles | undefined
  ) {
    return await this.searchUserService.adminSearch(
      keywords,
      limit,
      offset,
      desc,
      role
    );
  }
}
