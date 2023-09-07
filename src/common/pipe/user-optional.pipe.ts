import { ArgumentMetadata, BadRequestException, NotFoundException, PipeTransform } from "@nestjs/common";
import tips from "../tips";
import { User } from "../../modules/user/model/user.model";
import { Roles } from "../../modules/auth/role";

/**
 * 可选用户管道，若参数为undefined，则直接返回，若传入了参数，则需要检验用户是否存在，且用户角色必须是User
 */
export class UserOptionalPipe implements PipeTransform<string, Promise<number | undefined>>{
  userModel: typeof User
  constructor() {
    this.userModel = User
  }
  async transform(value: string | undefined): Promise<number | undefined> {
    if (value === undefined) {
      return undefined
    }
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
      throw new NotFoundException(tips.noExist('用户'))
    }
    if (user.role !== Roles.User) {
      throw new NotFoundException(tips.noExist('用户'))
    }
  }
}