import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { UserService } from "../user/user.service";
import { AuthRegisterDto } from "./dto/auth-register.dto";
import { Roles } from "./role";
import { AuthLoginDto } from "./dto/auth-login.dto";
import { decrpty } from "../../common/crypto";
import { PASSWORD_SECRET } from "../../config";
import { JwtService } from "@nestjs/jwt";
import { AuthUpdateDto } from "./dto/auth-update.dto";

@Injectable()
export class AuthService {
  constructor(
    // 注入用户服务层 不需要使用Inject来注入，因为UserService已经作为模块的提供者了
    private userService: UserService,
    // 注入jwt
    private jwtService: JwtService
  ) { }
  /**
   * 注册
   */
  register(authRegisterDto: AuthRegisterDto) {
    return this.userService.createUser(authRegisterDto, Roles.User)
  }
  /**
   * 登录
   */
  async login({ username, password }: AuthLoginDto) {
    // 查询用户名称是否存在
    const user = await this.userService.findUserByusername(username)
    if (user === null) {
      // 用户不存在
      throw new NotFoundException('用户名不存在!')
    }
    // 密码是否匹配
    const _dePassword = decrpty(user.password, PASSWORD_SECRET)
    if (_dePassword === password) {
      // 下发token
      return {
        access_token: await this.jwtService.signAsync({
          sub: user.uid,
        })
      }
    } else {
      throw new BadRequestException('用户名或密码错误!')
    }
  }
  /**
   * 更新指定的用户信息
   */
  async updateUser(uid: number, { username, password, avatar }: AuthUpdateDto) {
    // 更新用户基本信息
    await this.userService.updateUser(uid, { username, avatar })
    // 更新用户密码
    await this.userService.updateUserPassword(uid, password)
    return true
  }
}