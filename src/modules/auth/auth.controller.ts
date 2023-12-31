import { AuthService } from "./auth.service";
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";
import { Token } from "../../common/decorator";
import { Role } from "../../common/decorator/role.decorator";
import { AuthGuard, RoleGuard } from "../../common/guard";
import {
  DescPipe,
  LimitPipe,
  OffsetPipe,
  RolePipe,
  ValidationPipe,
} from "../../common/pipe";
import { TokenData } from "../../types/token";
import {
  AuthLoginDto,
  AuthRegisterDto,
  AuthRegiterAccountDto,
  AuthUpdateDto,
} from "./dto";
import { Roles } from "./role";

@Controller("auth")
export class AuthController {
  constructor(
    // 注入auth服务层 不需要使用Inject来注入，因为AuthService在模块中已经作为提供者了
    private authService: AuthService
  ) {}

  // 注册一个普通用户
  @Post("register")
  async register(@Body(new ValidationPipe()) authRegisterDto: AuthRegisterDto) {
    await this.authService.register(authRegisterDto);
    return null;
  }

  // 登录
  @Post("login")
  async login(@Body(new ValidationPipe()) authLoginDto: AuthLoginDto) {
    return await this.authService.login(authLoginDto);
  }

  // 超级管理员更新用户信息
  @Role(Roles.SuperAdmin)
  @UseGuards(AuthGuard, RoleGuard)
  @Put("update/:uid")
  async updateUser(
    @Param("uid", ParseIntPipe) uid: number,
    @Body(new ValidationPipe()) authUpdateDto: AuthUpdateDto
  ) {
    await this.authService.updateUser(uid, authUpdateDto);
    return null;
  }
  // 解析token
  @UseGuards(AuthGuard)
  @Get("token")
  token(@Req() req: Request, @Token() token: TokenData) {
    // @ts-ignore
    return req.user;
  }
  // 超级管理员创建账户
  @Role(Roles.SuperAdmin)
  @UseGuards(AuthGuard, RoleGuard)
  @Post("create/account")
  async registerAccount(
    @Body(new ValidationPipe()) authRegiterAccountDto: AuthRegiterAccountDto
  ) {
    await this.authService.registerAccount(authRegiterAccountDto);
    return null;
  }
  // 超级管理员获取账户列表
  @Role(Roles.SuperAdmin)
  @UseGuards(AuthGuard, RoleGuard)
  @Get("account/list")
  async getAccountList(
    @Query("role", RolePipe) role: Roles | undefined,
    @Query("limit", LimitPipe) limit: number,
    @Query("offset", OffsetPipe) offset: number,
    @Query("desc", DescPipe) desc: boolean
  ) {
    return await this.authService.getAccountList(role, limit, offset, desc);
  }
  // 获取User角色的用户
  @Role(Roles.SuperAdmin, Roles.Admin)
  @UseGuards(AuthGuard, RoleGuard)
  @Get("account/list/user")
  async getUserList(
    @Query("limit", LimitPipe) limit: number,
    @Query("offset", OffsetPipe) offset: number,
    @Query("desc", DescPipe) desc: boolean
  ) {
    return await this.authService.getAccountList(
      Roles.User,
      limit,
      offset,
      desc
    );
  }
}
