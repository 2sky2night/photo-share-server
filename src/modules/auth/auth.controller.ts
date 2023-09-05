import { Body, Controller, Get, Put, Param, ParseIntPipe, Post, Req, UseGuards } from "@nestjs/common";
import { ValidationPipe } from "../../common/pipe";
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

@Controller('auth')
export class AuthController {
  constructor(
    // 注入auth服务层 不需要使用Inject来注入，因为AuthService在模块中已经作为提供者了
    private authService: AuthService
  ) { }
  // 注册一个普通用户
  @Post('register')
  async register(@Body(new ValidationPipe()) authRegisterDto: AuthRegisterDto) {
    return await this.authService.register(authRegisterDto)
  }
  @Post('login')
  async login(@Body(new ValidationPipe()) authLoginDto: AuthLoginDto) {
    return await this.authService.login(authLoginDto)
  }
  @Role(Roles.SuperAdmin)
  @UseGuards(AuthGuard, RoleGuard)
  @Put('update/:uid')
  // 超级管理员更新用户信息
  async updateUser(@Param('uid', ParseIntPipe) uid: number, @Body(new ValidationPipe()) authUpdateDto: AuthUpdateDto) {
    await this.authService.updateUser(uid, authUpdateDto)
    return '更新用户信息成功!'
  }
  @UseGuards(AuthGuard)
  @Get('token')
  token(@Req() req: Request, @Token() token: TokenData) {
    // @ts-ignore
    return req.user
  }
}