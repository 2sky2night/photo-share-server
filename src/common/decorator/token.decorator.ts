import { BadGatewayException, createParamDecorator } from "@nestjs/common";
import { ExecutionContextHost } from "@nestjs/core/helpers/execution-context-host";
import { Request } from "express";
import { TokenData } from "../../types/token";

export const Token = createParamDecorator((data: "sub" | "iat" | "exp" | undefined, input: ExecutionContextHost) => {
  // data为装饰器调用时传入的参数，这里我们可以通过他结构出token中的某个属性
  const request = input.switchToHttp().getRequest<Request>()
  // @ts-ignore
  const tokenData: TokenData = request.user
  // 若中间件解析了token并保存在上下文中
  if (tokenData) {
    if (data === undefined) {
      // 不解析属性
      return tokenData
    } else {
      if (Object.keys(tokenData).includes(data)) {
        return tokenData[data]
      } else {
        throw new BadGatewayException(`token中无该属性:${data}`)
      }
    }
  } else {
    throw new BadGatewayException('上下文中无解析的token数据!')
  }
})