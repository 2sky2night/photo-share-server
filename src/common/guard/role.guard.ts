import { BadGatewayException, CanActivate, ExecutionContext, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Role } from "../../modules/auth/role";
import { Request } from "express";
import { TokenData } from "../../types/token";
import { User } from "../../modules/user/model/user.model";
import tips from "../tips";

@Injectable()
export class RoleGuard implements CanActivate {
  private userModel: typeof User
  constructor(private reflector: Reflector) {
    this.userModel = User
  }
  // 获取用户的id，通过用户id来查询用户的角色，再通过角色和路由处理函数所需的角色来判断用户是否有权限放行守卫
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.get<Role[]>('roles', context.getHandler())
    if (roles === undefined) {
      throw new InternalServerErrorException('未设置路由角色权限!')
    }
    const request = context.switchToHttp().getRequest<Request>()
    // @ts-ignore
    const playload = request.user as TokenData
    if (playload === undefined) {
      // 若无中间件解析token数据
      throw new BadGatewayException('请求上下文中无解析的token数据!')
    } else {
      // 查询用户角色
      const user = await this.userModel.findByPk(playload.sub)
      if (user === null) {
        // 用户表不存在该id
        throw new NotFoundException(tips.noExist('用户'))
      }
      if (roles.includes(user.role)) {
        return true
      } else {
        throw new ForbiddenException(tips.forbiddenError)
      }
    }
  }
} 