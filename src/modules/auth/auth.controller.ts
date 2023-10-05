import { Body, Controller, Get, Put, Param, ParseIntPipe, Post, Req, UseGuards, Query } from "@nestjs/common";
import { LimitPipe, OffsetPipe, ValidationPipe } from "../../common/pipe";
import { AuthRegisterDto } from "./dto/auth-register.dto";
import { AuthService } from "./auth.service";
import { AuthLoginDto } from "./dto/auth-login.dto";
import { Request } from "express";
import { AuthGuard, RoleGuard } from "../../common/guard";
import { Token } from "../../common/decorator";
import { TokenData } from "../../types/token";
import { AuthUpdateDto } from "./dto/auth-update.dto";
import { Role } from "../../common/decorator/role.decorator";
import { Roles } from "./role";
import { AuthRegiterAdminDto } from "./dto/auth-register-admin.dto";

@Controller('auth')
export class AuthController {
  constructor(
    // 注入auth服务层 不需要使用Inject来注入，因为AuthService在模块中已经作为提供者了
    private authService: AuthService
  ) { }

  // 注册一个普通用户
  @Post('register')
  async register(@Body(new ValidationPipe()) authRegisterDto: AuthRegisterDto) {
    await this.authService.register(authRegisterDto)
    return null
  }

  // 登录
  @Post('login')
  async login(@Body(new ValidationPipe()) authLoginDto: AuthLoginDto) {
    return await this.authService.login(authLoginDto)
  }

  // 超级管理员更新用户信息
  @Role(Roles.SuperAdmin)
  @UseGuards(AuthGuard, RoleGuard)
  @Put('update/:uid')
  async updateUser(@Param('uid', ParseIntPipe) uid: number, @Body(new ValidationPipe()) authUpdateDto: AuthUpdateDto) {
    await this.authService.updateUser(uid, authUpdateDto)
    return null
  }
  // 解析token
  @UseGuards(AuthGuard)
  @Get('token')
  token(@Req() req: Request, @Token() token: TokenData) {
    // @ts-ignore
    return req.user
  }
  // 超级管理员注册账户
  @Role(Roles.SuperAdmin)
  @UseGuards(AuthGuard, RoleGuard)
  @Post('register/admin')
  async registerAdmin(
    @Body(new ValidationPipe()) authRegiterAdminDto: AuthRegiterAdminDto
  ) {
    await this.authService.registerAdmin(authRegiterAdminDto)
    return null
  }
  // 超级管理员获取账户列表
  @Role(Roles.SuperAdmin)
  @UseGuards(AuthGuard, RoleGuard)
  @Get('account/list')
  async getAccountList(
    @Query('limit', LimitPipe) limit: number,
    @Query('offset', OffsetPipe) offset: number
  ) {
    return await this.authService.getAccountList(limit, offset)
  }
}