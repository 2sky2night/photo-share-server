import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { UserService } from "../user/user.service";
import {
  AuthRegisterDto,
  AuthUpdateDto,
  AuthLoginDto,
  AuthRegiterAccountDto,
} from "./dto";
import { Role, Roles } from "./role";
import { decrpty } from "../../common/crypto";
import { PASSWORD_SECRET } from "../../config";
import tips from "../../common/tips";
import { JWTService } from "../jwt/services";

@Injectable()
export class AuthService {
  constructor(
    // 注入用户服务层 不需要使用Inject来注入，因为UserService已经作为模块的提供者了
    private userService: UserService,
    // 注入jwt
    private jwtService: JWTService
  ) {}
  /**
   * 注册
   */
  register(authRegisterDto: AuthRegisterDto) {
    return this.userService.createUser(authRegisterDto, Roles.User);
  }
  /**
   * 登录
   */
  async login({ username, password }: AuthLoginDto) {
    // 查询用户名称是否存在
    const user = await this.userService.findUserByusername(username);
    if (user === null) {
      // 用户不存在
      throw new NotFoundException(tips.usernameNoExist);
    }
    // 密码是否匹配
    const _dePassword = decrpty(user.password, PASSWORD_SECRET);
    if (_dePassword === password) {
      // 下发token
      return {
        // 短期token
        access_token: await this.jwtService.signAccessToken(user.uid),
        // 长期token
        refresh_token: await this.jwtService.signRefreshToken(user.uid),
      };
    } else {
      throw new BadRequestException(tips.loginError);
    }
  }
  /**
   * 更新指定的用户信息
   */
  async updateUser(uid: number, { username, password, avatar }: AuthUpdateDto) {
    // 更新用户基本信息
    await this.userService.updateUser(uid, { username, avatar });
    // 更新用户密码
    if (password) await this.userService.updateUserPassword(uid, password);
    return true;
  }
  /**
   * 注册账户
   */
  async registerAccount(authRegiterAccountDto: AuthRegiterAccountDto) {
    return await this.userService.createUser(
      authRegiterAccountDto,
      authRegiterAccountDto.role
    );
  }
  /**
   * 获取账户列表
   * @param role 角色筛选条件
   * @param limit 长度
   * @param offset 偏移量
   * @param desc 是否降序
   * @returns
   */
  async getAccountList(
    role: Roles | undefined,
    limit: number,
    offset: number,
    desc: boolean
  ) {
    const { rows: list, count: total } = await this.userService.getAccountList(
      limit,
      offset,
      desc,
      role
    );
    return {
      list,
      total,
      limit,
      offset,
      desc,
      has_more: total > offset + limit,
    };
  }
}
