import { Provider } from "@nestjs/common";
import { databaseConfig } from "../config";
import { Sequelize } from "sequelize-typescript";
import { User } from "../modules/user/model/user.model";

export const databaseProvider: Provider[] = [
  {
    provide: 'DATABASE',
    async useFactory() {
      const sequelize = new Sequelize(databaseConfig)
      // 添加模型
      sequelize.addModels([
        User
      ])
      // 根据模型创建表
      await sequelize.sync()
      return sequelize
    },
  }
]