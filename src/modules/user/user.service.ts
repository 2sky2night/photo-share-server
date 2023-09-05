import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { User } from "./model/user.model";
import { encrpty } from "../../common/crypto";
import { PASSWORD_SECRET } from "../../config";
import { Role } from "../auth/role";
import { UserCreateDto } from "./dto/user-create.dto";
import { UserUpdateDto } from "./dto/user-update.dto";
import { Op } from "sequelize";

@Injectable()
export class UserService {
  constructor(
    // 注入user模型
    @Inject('UserModel') private userModel: typeof User
  ) { }
  /**
   * 创建用户
   * @param authRegisterDto 创建用户的数据
   */
  async createUser({ username, password }: UserCreateDto, role: Role) {
    // 查询用户名是否重复
    const user = await this.findUserByusername(username)
    if (user !== null) {
      // 用户存在了
      throw new BadRequestException('用户名已经存在了!')
    } else {
      // 注册用户
      // 加密密码
      const _password = encrpty(password, PASSWORD_SECRET)
      // 保存用户记录
      // @ts-ignore
      const user = await this.userModel.create({
        password: _password,
        username,
        role
      })
      return user
    }
  }
  /**
   * 通过主键查找用户
   * @param uid 用户id
   * @returns 
   */
  async findUser(uid: number) {
    return this.userModel.findByPk(uid)
  }
  /**
   * 根据用户名称查找用户
   * @param username 用户名称
   * @returns 
   */
  async findUserByusername(username: string) {
    const user = await this.userModel.findOne({
      where: {
        username
      }
    })
    return user
  }
  /**
   * 更新用户基本信息
   * @param uid 用户id
   * @param userUpdateDto 用户数据 
   */
  async updateUser(uid: number, { username, avatar }: UserUpdateDto) {
    // 查询id是否存在
    const user = await this.findUser(uid)
    if (user === null) {
      // 用户不存在
      throw new NotFoundException('该用户id不存在!')
    }
    // 用户存在,查询除了该用户以外是否还有其他同名用户
    const userOther = await this.userModel.findOne({
      where: {
        username,
        // 查询非更改用户以外的用户是否有同名的
        uid: {
          [Op.not]: uid
        }
      }
    })
    if (userOther) {
      // 用户名重复
      throw new BadRequestException('用户名已经存在了!')
    }
    // 修改用户信息
    user.username = username
    user.avatar = avatar
    await user.save()
    return true
  }
  /**
   * 更新用户密码
   * @param uid 用户id
   * @param password 用户密码
   */
  async updateUserPassword(uid: number, password: string) {
    // 用户是否存在
    const user = await this.findUser(uid)
    if (user) {
      // 加密密码
      const _password = encrpty(password, PASSWORD_SECRET)
      user.password = _password
      await user.save()
      return true
    } else {
      throw new NotFoundException('此用户id不存在!')
    }
  }
  /**
 *  获取用户信息
 */
  async info(uid: number) {
    const user = await this.findUser(uid)
    // 中间件已经检查过uid的存在性质了,不需要再写分支了
    return {
      username: user?.username,
      role: user?.role,
      avatar: user?.avatar
    }
  }
}