import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { PhotoTags, PhotoWithTags } from "../model";
import tips from "../../../common/tips";
import { TagsAlterDto } from "../dto";

@Injectable()
export class PhotoTagsService {
  constructor(
    /**
     * 照片标签模型
     */
    @Inject("PhotoTags") private PTModel: typeof PhotoTags,
    /**
     * 照片与标签关联的模型
     */
    @Inject("PhotoWithTags") private PWTModel: typeof PhotoWithTags
  ) {}
  /**
   * 查询某个标签
   * @param tid 标签id
   */
  async find(tid: number): Promise<PhotoTags | null>;
  /**
   * 查询某个标签 （必定找到）
   * @param tid 标签id
   * @param have 必定找到？
   */
  async find(tid: number, have: boolean): Promise<PhotoTags>;
  async find(tid: number, have = false) {
    const tags = await this.PTModel.findByPk(tid);
    if (tags || !have) {
      return tags;
    } else {
      throw new NotFoundException(tips.notFound("标签"));
    }
  }
  /**
   * 创建标签
   * @param uid 创建标签的用户
   * @param name_zh 标签中文
   * @param name_en 标签英文
   * @param description_zh 中文描述
   * @param description_en 英文描述
   */
  async create(
    uid: number,
    name_zh: string,
    name_en: string,
    description_zh: string | undefined,
    description_en: string | undefined
  ) {
    const row: Record<string, any> = { creator_uid: uid, name_en, name_zh };
    if (description_en) {
      row.description_en = description_en;
    }
    if (description_zh) {
      row.description_zh = description_zh;
    }
    // @ts-ignore
    const tags = await this.PTModel.create(row);
    return tags;
  }
  /**
   * 删除标签
   * @param tid 标签id
   */
  async delete(tid: number) {
    const tags = await this.find(tid, true);
    await tags.destroy();
  }
  /**
   * 修改标签
   * @param tid 标签id
   * @param tagsAlterDto 数据传输对象
   */
  async alter(
    tid: number,
    { descriptionEN, descriptionZH, nameEN, nameZH }: TagsAlterDto
  ) {
    const tags = await this.find(tid, true);
    if (descriptionEN) {
      tags.set("description_en", descriptionEN);
    }
    if (descriptionZH) {
      tags.set("description_zh", descriptionZH);
    }
    if (nameEN) {
      tags.set("name_en", nameEN);
    }
    if (nameZH) {
      tags.set("name_zh", nameZH);
    }
    await tags.save();
  }
  // TO-DO 获取标签
}
