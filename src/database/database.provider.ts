import { Provider } from "@nestjs/common";
import { databaseConfig } from "../config";
import { Sequelize } from "sequelize-typescript";
import { User } from "../modules/user/model";
import {
  UserLikeComment,
  UserCommentPhoto,
  UserLikePhoto,
  Photo,
  PhotoTags,
  PhotoWithTags,
} from "../modules/photo/model";

export const databaseProvider: Provider[] = [
  {
    provide: "DATABASE",
    async useFactory() {
      const sequelize = new Sequelize(databaseConfig);
      // 添加模型
      sequelize.addModels([
        User,
        Photo,
        UserLikePhoto,
        UserCommentPhoto,
        UserLikeComment,
        PhotoTags,
        PhotoWithTags,
      ]);
      // 根据模型创建表
      await sequelize.sync();
      return sequelize;
    },
  },
];
