import { Provider } from "@nestjs/common";
import { databaseConfig } from "../config";
import { Sequelize } from "sequelize-typescript";
import { User } from "../modules/user/model/user.model";
import { Photo } from "../modules/photo/model/photo.model";
import { UserLikePhoto } from "../modules/photo/model/user-like-photo.model";
import { UserCommentPhoto } from "../modules/photo/model/user-comment-photo";
import { UserLikeComment } from "../modules/photo/model/user-like-comment.model";

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
      ]);
      // 根据模型创建表
      await sequelize.sync();
      return sequelize;
    },
  },
];
