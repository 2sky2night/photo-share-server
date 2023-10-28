import { Table, Model, Column, PrimaryKey, Comment, DataType, AutoIncrement, Length, Default, HasMany, BelongsTo, BelongsToMany } from "sequelize-typescript";
import { Role, Roles, roles } from "../../auth/role";
import { Photo } from "../../photo/model/photo.model";
import { UserLikePhoto } from "../../photo/model/user-like-photo.model";
import { UserCommentPhoto } from "../../photo/model/user-comment-photo";
import { UserLikeComment } from "../../photo/model/user-like-comment.model";
@Table({
  tableName: 'user'
})
export class User extends Model<User>{

  @Comment('账户id')
  @PrimaryKey
  @AutoIncrement
  @Column
  uid: number;

  @Comment('账户名称')
  @Column(DataType.STRING)
  username: string;

  @Comment('账户密码')
  @Column(DataType.STRING)
  password: string;

  @Length({ max: 512 })
  @Comment('账户头像')
  @Column(DataType.STRING)
  avatar: string;

  @Comment('用户角色')
  @Column(DataType.ENUM(...roles))
  // @Default(Roles.User)
  role: Role

  // 一个作者有多个照片 (这样设置后，publish_uid会作为Photo表的外键，引用User表的uid，默认引用主键)
  @HasMany(() => Photo, 'publish_uid')
  authorPhotos: Photo[]

  // 一个审核可以审核多个照片 (这样设置后，audit_uid会作为Photo表的外键，引用User表的uid，自定义指定引用User的uid字段)
  @HasMany(() => Photo, {
    sourceKey: 'uid',
    foreignKey: 'audit_uid'
  })
  auditPhotos: Photo[]

  // 一个用户可以喜欢多个照片
  @BelongsToMany(() => Photo, () => UserLikePhoto, 'uid')
  likePhotos: Photo[]

  // 一个用户可以评论多个照片
  @BelongsToMany(() => Photo, () => UserCommentPhoto, 'uid')
  commentedPhotos: Photo[]

  // 一个用户可以点赞多个评论
  @BelongsToMany(() => UserCommentPhoto, () => UserLikeComment, 'uid')
  likedComments: UserCommentPhoto[]
}