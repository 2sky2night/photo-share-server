import {
  Table,
  Model,
  Column,
  PrimaryKey,
  AutoIncrement,
  Comment,
  DataType,
  Length,
  ForeignKey,
  BelongsTo,
  NotNull,
  AllowNull,
  Default,
  BelongsToMany,
} from "sequelize-typescript";
import { User } from "../../user/model/user.model";
import { AuditStatusList } from "../../../types/photo";
import { UserLikePhoto } from "./user-like-photo.model";
import { UserCommentPhoto } from "./user-comment-photo";

@Table({
  tableName: "photo",
})
export class Photo extends Model<Photo> {
  @PrimaryKey
  @AutoIncrement
  @Comment("照片id")
  @Column
  pid: number;

  @Length({ min: 1, max: 20, msg: "标题长度为1-20位字符!" })
  @Comment("照片标题")
  @Column(DataType.STRING)
  title: string;

  @Comment("照片的描述")
  @Length({ min: 1, max: 255, msg: "描述长度为1-255位字符!" })
  @Column(DataType.TEXT)
  content: string;

  @Comment("照片列表")
  @Column(DataType.JSON)
  photos: string;

  @ForeignKey(() => User)
  @Comment("照片作者id")
  @Column
  publish_uid: number;

  @ForeignKey(() => User)
  @Comment("审核人id")
  @Column
  audit_uid: number;

  @Comment("审核时间")
  @AllowNull
  @Column(DataType.DATE)
  audit_time: Date;

  @Comment("审核描述")
  @Length({ msg: "审核描述长度为1-255", min: 1, max: 255 })
  @AllowNull
  @Column(DataType.STRING)
  audit_desc: string | null;

  @Comment("审核状态，0未审核 1审核通过 2审核不通过")
  @Default(0)
  @Column(DataType.TINYINT)
  status: AuditStatusList;

  @Comment("浏览量")
  @Default(0)
  @Column(DataType.INTEGER)
  views: number;

  // 一个照片只能有一个作者,(声明publish_uid是外键)
  @BelongsTo(() => User, "publish_uid")
  author: User;

  // 一个照片只能被一个管理员审核,(声明audit_uid是外键)
  @BelongsTo(() => User, "audit_uid")
  auditor: User;

  // 一个照片可以被多个用户喜欢(第一个参数是多对多谁？，第二个参数是多对多的关系表，)
  @BelongsToMany(() => User, () => UserLikePhoto, "pid")
  // 关联名称，sequelize会以likeds创建操作User的函数
  likeds: User[];

  // 一个照片有多个评论
  @BelongsToMany(() => User, () => UserCommentPhoto, "pid")
  commentor: User[];

  /**
   * 获取喜欢该照片的用户
   */
  declare getLikeds: () => Promise<User[]>;
}
