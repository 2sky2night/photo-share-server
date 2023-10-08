import { Injectable } from "@nestjs/common";
import { UserService } from "../../user/user.service";
import { Op } from "sequelize";
import { Roles } from "../../auth/role";

/**
 * 搜索用户服务层
 */
@Injectable()
export class SearchUserService {
  constructor(private userService: UserService) {}
  /**
   * User搜索内容
   */
  async userSearch(
    keywords: string,
    limit: number,
    offset: number,
    desc: boolean
  ) {
    return await this.toSearch(
      keywords,
      limit,
      offset,
      desc,
      false,
      Roles.User
    );
  }
  /**
   * 管理员搜索
   */
  async adminSearch(
    keywords: string,
    limit: number,
    offset: number,
    desc: boolean,
    role?: Roles
  ) {
    return await this.toSearch(keywords, limit, offset, desc, true, role);
  }

  /**
   * 搜索账户
   * @param keywords 关键词
   * @param limit 长度
   * @param offset 偏移量
   * @param desc 降序
   * @param role 角色
   */
  async toSearch(
    keywords: string,
    limit: number,
    offset: number,
    desc: boolean,
    isSuperAdmin: boolean,
    role: Roles | undefined
  ) {
    const where = role
      ? {
          username: {
            [Op.like]: `%${keywords}%`,
          },
          role,
        }
      : {
          username: {
            [Op.like]: `%${keywords}%`,
          },
        };

    const { rows: list, count: total } =
      await this.userService.userModel.findAndCountAll({
        attributes: {
          exclude: isSuperAdmin ? ["password"] : ["password", "role"],
        },
        where,
        limit,
        offset,
        order: [desc ? ["createdAt", "desc"] : ["createdAt", "asc"]],
      });
    return {
      list,
      offset,
      limit,
      desc,
      total,
      has_more: total > offset + limit,
    };
  }
}
