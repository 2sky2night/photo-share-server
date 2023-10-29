import { Column, Comment, ForeignKey, Model, Table } from "sequelize-typescript";
import { User } from "../../user/model";
import { UserCommentPhoto } from ".";

@Table({ tableName: 'user_like_comment' })
export class UserLikeComment extends Model<UserLikeComment> {
  @ForeignKey(() => User)
  @Comment('点赞者')
  @Column
  uid!: number;

  @Comment('点赞的目标评论')
  @ForeignKey(() => UserCommentPhoto)
  @Column
  cid!: number;
}