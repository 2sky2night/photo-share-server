import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Op } from "sequelize";
import { decrpty, encrpty } from "../../common/crypto";
import tips from "../../common/tips";
import { PASSWORD_SECRET } from "../../config";
import { Role, Roles } from "../auth/role";
import { UserCreateDto, UserUpdateDto, UserUpdatePasswordDto } from "./dto";
import { User } from "./model";

@Injectable()
export class UserService {
  constructor(
    // 注入user模型
    @Inject("UserModel") readonly userModel: typeof User
  ) {}
  /**
   * 创建用户
   * @param authRegisterDto 创建用户的数据
   * @param role 创建用户时的角色
   */
  async createUser({ username, password }: UserCreateDto, role: Role) {
    // 查询用户名是否重复
    const user = await this.findUserByusername(username);
    if (user !== null) {
      // 用户存在了
      throw new BadRequestException(tips.usernameIsExist);
    } else {
      // 注册用户
      // 加密密码
      const _password = encrpty(password, PASSWORD_SECRET);
      // 保存用户记录
      // @ts-ignore
      const user = await this.userModel.create({
        password: _password,
        username,
        role,
      });
      return user;
    }
  }
  /**
   * 获取用户信息，不包含密码和角色信息 （一定找到该用户）
   * @param uid 用户id
   */
  async findUserWithoutPasswordAndRole(uid: number) {
    const user = await this.userModel.findOne({
      attributes: {
        exclude: ["password", "role"],
      },
      where: {
        uid,
      },
    });
    if (user === null) {
      throw new NotFoundException(tips.notFound("用户"));
    }
    return user;
  }
  /**
   * 通过主键查找用户(不一定能找到该用户)
   * @param uid 用户id
   * @returns
   */
  async find(uid: number) {
    return this.userModel.findByPk(uid);
  }
  /**
   * 根据用户名称查找用户
   * @param username 用户名称
   * @returns
   */
  async findUserByusername(username: string) {
    const user = await this.userModel.findOne({
      where: {
        username,
      },
    });
    return user;
  }
  /**
   * 更新用户基本信息
   * @param uid 用户id
   * @param userUpdateDto 用户数据
   */
  async updateUser(uid: number, { username, avatar }: UserUpdateDto) {
    // 查询id是否存在
    const user = await this.findUser(uid);
    // 修改用户信息
    if (username) {
      // 查询除了该用户以外是否还有其他同名用户
      const userOther = await this.userModel.findOne({
        where: {
          username,
          // 查询非更改用户以外的用户是否有同名的
          uid: {
            [Op.not]: uid,
          },
        },
      });
      if (userOther) {
        // 用户名重复
        throw new BadRequestException(tips.usernameIsExist);
      }
      user.username = username;
    }
    if (avatar) user.avatar = avatar;
    await user.save();
    return {
      username,
      avatar,
    };
  }
  /**
   * 更新用户密码
   * @param uid 用户id
   * @param password 用户密码
   */
  async updateUserPassword(uid: number, password: string) {
    // 用户是否存在
    const user = await this.findUser(uid);
    // 加密密码
    const _password = encrpty(password, PASSWORD_SECRET);
    user.password = _password;
    await user.save();
  }
  /**
   * 更新用户密码（校验旧密码是否正确?）
   * @param uid
   * @param userUpdatePasswordDto
   */
  async toUpdateUserPassword(
    uid: number,
    { password, oldPassword }: UserUpdatePasswordDto
  ) {
    // 用户是否存在
    const user = await this.findUser(uid);
    // 解密密码
    const _password = decrpty(user.password, PASSWORD_SECRET);
    console.log(_password);

    if (oldPassword === _password) {
      // 校验成功
      return await this.updateUserPassword(uid, password);
    } else {
      // 校验失败
      throw new BadRequestException(tips.oldPasswordError);
    }
  }
  /**
   * 获取用户信息 必定找到该用户
   * @param uid 用户id
   * @param exclude 哪些属性需要过滤掉
   * @returns
   */
  async findUser(uid: number, exclude?: (keyof User)[]) {
    const user = await this.userModel.findOne({
      where: { uid },
      attributes: {
        exclude: exclude ? exclude : [],
      },
    });
    if (user === null) {
      throw new NotFoundException(tips.noExist("用户"));
    }
    return user;
  }
  /**
   *  获取用户信息
   */
  async info(uid: number) {
    const user = await this.findUser(uid, ["password"]);
    return user;
  }
  /**
   * 获取账户列表
   * @param limit 长度
   * @param offset 偏移量
   * @param desc 创建时间降序
   * @param role 筛选类型
   * @returns
   */
  async getAccountList(
    limit: number,
    offset: number,
    desc: boolean,
    role: Roles | undefined
  ): Promise<{ rows: User[]; count: number; desc: boolean }> {
    const result = await this.userModel.findAndCountAll({
      where:
        role === undefined
          ? {}
          : {
              role,
            },
      order: desc ? [["createdAt", "desc"]] : [["createdAt", "asc"]],
      attributes: { exclude: ["password"] },
      limit,
      offset,
    });
    return { ...result, desc };
  }
  /**
   * 获取user基本信息，只要角色为user的 User管道必须要拦截非User角色的访问
   * @param uid
   */
  async getUser(uid: number) {
    const user = await this.findUserWithoutPasswordAndRole(uid);
    return user;
  }
}
