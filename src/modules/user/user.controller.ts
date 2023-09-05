import { Controller, Put, Body, UseGuards, Get } from "@nestjs/common";
import { ValidationPipe } from "../../common/pipe";
import { UserUpdateDto } from "./dto/user-update.dto";
import { UserService } from "./user.service";
import { AuthGuard } from "../../common/guard";
import { Token } from "../../common/decorator";
import { UserUpdatePasswordDto } from "./dto/user-update-password.dto";

@Controller('user')
export class UserController {
  constructor(
    private userService: UserService
  ) { }
  @UseGuards(AuthGuard)
  @Put('update')
  // 修改用户基本信息(用户自己修改自己的信息)
  async updateUser(@Token('sub') uid: number, @Body(new ValidationPipe()) userUpdateDto: UserUpdateDto) {
    await this.userService.updateUser(uid, userUpdateDto)
    return '更新用户信息成功!'
  }
  @UseGuards(AuthGuard)
  @Put('password')
  // 修改用户自己的密码
  async updatePassword(@Token('sub') uid: number, @Body(new ValidationPipe()) userUpdatePasswordDto: UserUpdatePasswordDto) {
    await this.userService.updateUserPassword(uid, userUpdatePasswordDto.password)
    return '更新用户密码成功!'
  }
  // 获取用户基本信息
  @UseGuards(AuthGuard)
  @Get('info')
  async info(@Token('sub') uid: number) {
    return await this.userService.info(uid)
  }
}