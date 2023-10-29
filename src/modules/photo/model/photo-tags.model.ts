import {
  Column,
  Model,
  PrimaryKey,
  Table,
  Comment,
  DataType,
  Length,
  BelongsToMany,
  AllowNull,
  ForeignKey,
  BelongsTo,
  AutoIncrement,
} from "sequelize-typescript";
import { Photo, PhotoWithTags } from ".";
import { User } from "../../user/model";

/**
 * 照片标签模型
 */
@Table({
  tableName: "photo_tags",
})
export class PhotoTags extends Model<PhotoTags> {
  @PrimaryKey
  @AutoIncrement
  @Comment("标签的id")
  @Column
  tid!: number;

  @Comment("标签的中文")
  @Length({ min: 1, max: 255, msg: "标签的中文长度为1-255" })
  @Column
  name_zh!: string;

  @Comment("标签的英文")
  @Length({ min: 1, max: 255, msg: "标签的英文长度为1-255" })
  @Column
  name_en!: string;

  @Comment("标签的中文描述")
  @AllowNull
  @Length({ min: 1, max: 255, msg: "标签的中文描述长度为1-255" })
  @Column({
    type: DataType.STRING,
  })
  description_zh!: string | null;

  @Comment("标签的英文描述")
  @AllowNull
  @Length({ min: 1, max: 255, msg: "标签的英文描述长度为1-255" })
  @Column({
    type: DataType.STRING,
  })
  description_en!: string | null;

  @ForeignKey(() => User)
  @Comment("创建标签的管理员id")
  @Column
  creator_uid!: number;

  // 标签和照片多对多
  @BelongsToMany(() => Photo, () => PhotoWithTags)
  photos!: Photo[];

  // 标签与创建者，多对一
  @BelongsTo(() => User)
  tagsCreator!: User;

  /**
   * 获取哪些照片拥有该标签
   */
  declare getPhotos: () => Promise<Photo[]>;
}
