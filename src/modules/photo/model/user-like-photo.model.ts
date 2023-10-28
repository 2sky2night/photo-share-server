import { ForeignKey, Table, Model } from "sequelize-typescript";
import { User } from "../../user/model/user.model";
import { Photo } from "./photo.model";

@Table({
  tableName: "user_like_photo",
})
export class UserLikePhoto extends Model<UserLikePhoto> {
  // 声明，uid是引用的user的主键
  @ForeignKey(() => User)
  uid: number;
  // 声明，pid是引用的photo的主键
  @ForeignKey(() => Photo)
  pid: number;
}
