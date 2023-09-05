import { Module } from "@nestjs/common";
import { userProvider } from "./user.provider";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";

@Module({
  controllers: [
    UserController
  ],
  // 注入
  providers: [
    ...userProvider,
    UserService
  ],
  // 导出
  exports: [
    // 导出user提供者
    ...userProvider,
    // 导出服务层
    UserService
  ]
})
export class UserModule { }
