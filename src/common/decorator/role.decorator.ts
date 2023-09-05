// role.decorator.ts
import { SetMetadata } from "@nestjs/common";
import { Role as RoleType } from "../../modules/auth/role";

export const Role = (...roles: RoleType[]) => {
  return SetMetadata('roles', roles)
}