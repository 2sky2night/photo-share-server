import { UserService } from "./user.service";
import { Controller, Put, Body, UseGuards, Get, Param } from "@nestjs/common";
import { UserPipe, ValidationPipe } from "../../common/pipe";
import { UserUpdateDto, UserUpdatePasswordDto } from "./dto";
import { AuthGuard } from "../../common/guard";
import { Token } from "../../common/decorator";

@Controller('user')
export class UserController {
  constructor(
    private userService: UserService
  ) { }
  @UseGuards(AuthGuard)
  @Put('update')
  // 修改用户基本信息(用户自己修改自己的信息)
  async updateUser(@Token('sub') uid: number, @Body(new ValidationPipe()) userUpdateDto: UserUpdateDto) {
    const result=await this.userService.updateUser(uid, userUpdateDto)
    return result;
  }
  @UseGuards(AuthGuard)
  @Put('password')
  // 修改用户自己的密码
  async updatePassword(@Token('sub') uid: number, @Body(new ValidationPipe()) userUpdatePasswordDto: UserUpdatePasswordDto) {
    await this.userService.toUpdateUserPassword(
      uid,
      userUpdatePasswordDto
    );
    return null
  }
  // 获取用户基本信息
  @UseGuards(AuthGuard)
  @Get('info')
  async info(@Token('sub') uid: number) {
    return await this.userService.info(uid)
  }
  // 获取user基本信息
  @Get('info/:uid')
  async getInfo(
    @Param('uid', UserPipe) uid: number
  ) {
    return await this.userService.getUser(uid)
  }
}