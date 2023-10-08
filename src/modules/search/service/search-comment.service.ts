import { Injectable } from "@nestjs/common";
import { UserCommentPhotoService } from "../../photo/service";
import { Op } from "sequelize";

/**
 * 搜索评论服务层
 */
@Injectable()
export class SearchCommentService {
  constructor(private userCommentPhotoService: UserCommentPhotoService) {}
  /**
   * 用户搜索评论
   */
  async search(
    currentUid: number | undefined,
    keywords: string,
    offset: number,
    limit: number,
    desc: boolean
  ) {
    const result = await this.toSearch(keywords, offset, limit, desc);
    const list = await this.userCommentPhotoService.getCommentsInfo(
      result.list,
      currentUid
    );
    return {
      ...result,
      list,
    };
  }
  /**
   * 搜索评论
   * @param keywords 关键词
   * @param offset 偏移量
   * @param limit 长度
   * @param desc 降序
   * @returns
   */
  async toSearch(
    keywords: string,
    offset: number,
    limit: number,
    desc: boolean
  ) {
    const { rows:list, count: total } =
      await this.userCommentPhotoService.UCPModel.findAndCountAll({
        where: {
          content: {
            [Op.like]: `%${keywords}%`,
          },
        },
        offset,
        limit,
        order: [desc ? ["createdAt", "desc"] : ["createdAt", "asc"]],
      });
    return {
      list,
      offset,
      limit,
      desc,
      total,
      has_more: total > offset + limit,
    };
  }
}
