import { BadRequestException, PipeTransform } from "@nestjs/common";
import { Roles } from "../../modules/auth/role";
import tips from "../tips";

/**
 * 校验role，传入undefined，返回undefined
 */
export class RolePipe
  implements PipeTransform<string | undefined, Roles | undefined>
{
  transform(value: string | undefined): Roles | undefined {
    if (value === undefined) return undefined;
    if (
      value !== Roles.Admin &&
      value !== Roles.SuperAdmin &&
      value !== Roles.User
    ) {
      throw new BadRequestException(tips.paramsError("role"));
    }
    return value;
  }
}
