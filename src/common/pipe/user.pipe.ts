import { BadRequestException, PipeTransform } from "@nestjs/common";
import { User } from "../../modules/user/model/user.model";
import tips from "../tips";
import { Roles } from "../../modules/auth/role";

/**
 * 用户管道，解析参数，并查询用户是否存在，且用户角色必须是User
 */
export class UserPipe implements PipeTransform<string, Promise<number>>{
  userModel: typeof User
  constructor() {
    this.userModel = User
  }
  async transform(value: string): Promise<number> {
    const uid = +value
    if (isNaN(uid)) {
      throw new BadRequestException(tips.paramsError('uid'))
    }
    await this.getUser(uid)
    return uid
  }
  async getUser(uid: number) {
    const user = await this.userModel.findByPk(uid)
    if (user === null) {
      throw new BadRequestException(tips.requestError)
    }
    if (user.role !== Roles.User) {
      throw new BadRequestException(tips.requestError)
    }
  }
}