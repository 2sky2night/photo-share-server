import {
  BadRequestException,
  NotFoundException,
  PipeTransform,
} from "@nestjs/common";
import { User } from "../../modules/user/model/user.model";
import tips from "../tips";
import { Roles } from "../../modules/auth/role";

/**
 * 用户管道，解析参数，并查询用户是否存在，且用户角色必须是User
 */
export class UserPipe implements PipeTransform<string, Promise<number>> {
  userModel: typeof User;
  constructor() {
    this.userModel = User;
  }
  async transform(value: string): Promise<number> {
    const uid = +value;
    if (isNaN(uid)) {
      throw new BadRequestException(tips.paramsError("uid"));
    }
    // 校验请求目标用户身份
    await this.getUser(uid);
    return uid;
  }
  async getUser(uid: number) {
    const user = await this.userModel.findByPk(uid);
    if (user === null) {
      // 未找到用户
      throw new NotFoundException(tips.requestError);
    }
    if (user.role !== Roles.User) {
      // 用户非User角色
      throw new BadRequestException(tips.requestError);
    }
  }
}
