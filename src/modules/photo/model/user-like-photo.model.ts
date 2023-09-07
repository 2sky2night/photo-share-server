import { ForeignKey, Table,Model } from "sequelize-typescript";
import { User } from "../../user/model/user.model";
import { Photo } from "./photo.model";

@Table({
  tableName:'user_like_photo'
})
export class UserLikePhoto extends Model<UserLikePhoto> {
  @ForeignKey(() => User)
  uid: number;
  
  @ForeignKey(() => Photo)
  pid: number;

}