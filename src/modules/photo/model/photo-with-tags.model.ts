import { Table, Model, ForeignKey } from "sequelize-typescript";
import { Photo, PhotoTags } from ".";

/**
 * 照片与标签的联系表 
 */
@Table({
  tableName: "photo_with_tags",
})
export class PhotoWithTags extends Model<PhotoWithTags> {
  @ForeignKey(() => Photo)
  pid!: number;

  @ForeignKey(() => PhotoTags)
  tid!:number
}
