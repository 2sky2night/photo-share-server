import {
  Column,
  ForeignKey,
  Table,
  Comment,
  DataType,
  Length,
  Model,
  BelongsToMany,
  PrimaryKey,
  AutoIncrement,
  DeletedAt,
} from "sequelize-typescript";
import { User } from "../../user/model/user.model";
import { Photo } from "./photo.model";
import { UserLikeComment } from "./user-like-comment.model";

@Table({ tableName: "user_comment_photo", paranoid: true })
export class UserCommentPhoto extends Model<UserCommentPhoto> {
  @Comment("评论的id")
  @PrimaryKey
  @AutoIncrement
  @Column
  cid: number;

  @Comment("发布评论的用户")
  @ForeignKey(() => User)
  @Column
  uid: number;

  @Comment("评论的哪个照片")
  @ForeignKey(() => Photo)
  @Column
  pid: number;

  @Comment("评论内容")
  @Length({ min: 1, max: 255, msg: "评论内容长度为1-255位!" })
  @Column(DataType.STRING)
  content: string;

  // 一个评论可以被多个用户点赞
  @BelongsToMany(() => User, () => UserLikeComment, "cid")
  likedUser: User[];

  @DeletedAt
  deletedAt: Date;
}
