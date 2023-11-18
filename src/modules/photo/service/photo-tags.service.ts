import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { UserService } from "../../user/user.service";
import { User } from "../../user/model";
import { Photo, PhotoTags, PhotoWithTags } from "../model";
import tips from "../../../common/tips";
import { TagsAlterDto } from "../dto";
import type { WhereOptions } from "sequelize";

@Injectable()
export class PhotoTagsService {
  constructor(
    /**
     * 照片标签模型
     */
    @Inject("PhotoTagsModel") readonly PTModel: typeof PhotoTags,
    /**
     * 照片与标签关联的模型
     */
    @Inject("PhotoWithTagsModel") readonly PWTModel: typeof PhotoWithTags,
    /**
     * 照片模型
     */
    @Inject("PhotoModel") readonly photoModel: typeof Photo,
    /**
     * 用户服务层
     */
    private userService: UserService
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
  async find(tid: number, have: true): Promise<PhotoTags>;
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
    if (typeof descriptionEN === "string") {
      if (descriptionEN.length) {
        tags.set("description_en", descriptionEN);
      } else {
        // 空串 设置为null
        tags.set("description_en", null);
      }
    }
    if (typeof descriptionZH === "string") {
      if (descriptionZH.length) {
        tags.set("description_zh", descriptionZH);
      } else {
        // 空串 设置为null
        tags.set("description_zh", null);
      }
    }
    if (nameEN) {
      tags.set("name_en", nameEN);
    }
    if (nameZH) {
      tags.set("name_zh", nameZH);
    }
    await tags.save();
  }
  /**
   * 管理员获取标签列表
   * @param limit 长度
   * @param offset 起始偏移量
   * @param desc 是否降序
   * @param creator_uid 是否查询某个用户创建的标签
   * @returns
   */
  async list(
    limit: number,
    offset: number,
    desc: boolean,
    creator_uid: number | undefined
  ) {
    const { rows, count: total } = await this.getList(
      limit,
      offset,
      desc,
      creator_uid !== undefined ? { creator_uid } : {}
    );
    return {
      list: await this.getTagsCreator(rows),
      offset,
      limit,
      desc,
      total,
      has_more: total > limit + offset,
    };
  }
  /**
   * 获取标签列表
   * @param limit 长度
   * @param offset 偏移量
   * @param desc 是否降序
   * @returns
   */
  async userGetList(limit: number, offset: number, desc: boolean) {
    const { rows: list, count: total } = await this.getList(
      limit,
      offset,
      desc,
      {},
      ["creator_uid"]
    );
    return {
      list,
      total,
      limit,
      offset,
      desc,
      has_more: total > limit + offset,
    };
  }
  /**
   * 查询标签的作者并返回标签的详情信息
   * @param tags 标签列表
   * @returns
   */
  async getTagsCreator(tags: PhotoTags[]) {
    // 缓存区
    const users: User[] = [];
    return Promise.all<(PhotoTags & { creator: User })[]>(
      // @ts-ignore
      tags.map(async (item) => {
        // 查询缓存区是否查询了该用户信息
        const index = users.findIndex((user) => user.uid === item.creator_uid);
        return {
          ...item.dataValues,
          creator:
            index !== -1
              ? users[index]
              : await this.userService.findUser(item.creator_uid, [
                  "password",
                  "role",
                ]),
        };
      })
    );
  }
  /**
   * 获取标签列表
   * @param limit 长度
   * @param offset 偏移量
   * @param desc 是否降序
   * @param where 查询条件
   * @param exclude 哪些属性不需要?
   * @returns
   */
  getList(
    limit: number,
    offset: number,
    desc: boolean,
    where: WhereOptions<PhotoTags> = {},
    exclude: (keyof PhotoTags)[] = []
  ) {
    return this.PTModel.findAndCountAll({
      where,
      limit,
      attributes: {
        exclude,
      },
      offset,
      order: [["createdAt", desc ? "desc" : "asc"]],
    });
  }
  /**
   * 查询每个标签id是否存在
   * @param tids 标签id列表
   * @returns
   */
  findList(tids: number[]) {
    return Promise.all(
      tids.map(async (tid) => {
        return await this.find(tid, true);
      })
    );
  }
  /**
   * 给照片添加标签
   * @param pid 照片id （照片id需要存在）
   * @param tids 标签列表 (需要检查标签id是否存在)
   */
  async setPhotoTags(pid: number, tids: number[]) {
    // 遍历标签id列表，设置照片的标签
    await Promise.all(
      tids.map(async (tid) => {
        // @ts-ignore
        return await this.PWTModel.create({
          pid,
          tid,
        });
      })
    );
  }
  /**
   * 获取照片的标签
   * @param pid 照片id
   * @returns 标签列表
   */
  async getPhotoTags(pid: number) {
    const photo = await this.findPhoto(pid);
    const tags = await photo.getTags();
    return tags.map((item) => {
      Reflect.deleteProperty(item.dataValues, "PhotoWithTags");
      return {
        ...item.dataValues,
      };
    });
  }
  /**
   * 查询照片
   * @param pid 照片id
   * @returns
   */
  async findPhoto(pid: number) {
    const photo = await this.photoModel.findByPk(pid);
    if (photo) {
      return photo;
    } else {
      throw new NotFoundException(tips.noExist("照片"));
    }
  }
}
