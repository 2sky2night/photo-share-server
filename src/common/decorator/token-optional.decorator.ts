import {
  InternalServerErrorException,
  createParamDecorator,
} from "@nestjs/common";
import { TokenData, TokenKey } from "../../types/token";
import { ExecutionContextHost } from "@nestjs/core/helpers/execution-context-host";

/**
 * token可选解析
 */
export const TokenOptional = createParamDecorator(
  (data: TokenKey, input: ExecutionContextHost) => {
    const request = input.switchToHttp().getRequest();
    const playload = request.user as TokenData;
    if (playload === undefined) {
      // 未登录用户
      return undefined;
    } else {
      // 登录用户
      if (data === undefined) {
        // 未指定属性值
        return playload;
      } else {
        const value = playload[data];
        if (value === undefined) {
          throw new InternalServerErrorException(`token中没有该属性:${data}`);
        } else {
          return value;
        }
      }
    }
  }
);
