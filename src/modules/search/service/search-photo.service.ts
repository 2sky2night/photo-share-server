import { Injectable } from "@nestjs/common";
import { PhotoService } from "../../photo/service";
import { AuditStatusList } from "../../../types/photo";
import { Op } from "sequelize";

/**
 * 搜索照片Service层
 */
@Injectable()
export class SearchPhotoService {
  constructor(private photoService: PhotoService) {}
  /**
   * User搜索照片(搜索的照片只能是通过的照片)
   */
  async userSearchPhoto(
    currentUid: number | undefined,
    keywords: string,
    offset: number,
    limit: number,
    desc: boolean
  ) {
    const { list: photoList, total } = await this.search(
      keywords,
      offset,
      limit,
      desc,
      AuditStatusList.Pass
    );

    const list = await this.photoService.getPhotosInfo(photoList, currentUid);

    return {
      list,
      limit,
      offset,
      desc,
      total,
      has_more: total > offset + limit,
    };
  }
  /**
   * 管理员搜索照片
   */
  async searchPhoto(
    keywords: string,
    offset: number,
    limit: number,
    desc: boolean,
    status: AuditStatusList | undefined
  ) {
    const { list: photoList, total } = await this.search(
      keywords,
      offset,
      limit,
      desc,
      status
    );
    const list = photoList.map((photo) => this.photoService.formatPhoto(photo));
    return {
      list,
      total,
      offset,
      limit,
      status,
      desc,
    };
  }
  /**
   * 搜索照片
   * @param keywords 关键词
   * @param offset 偏移量
   * @param limit 长度
   * @param desc 降序
   * @param status 审核状态
   * @returns
   */
  async search(
    keywords: string,
    offset: number,
    limit: number,
    desc: boolean,
    status?: AuditStatusList
  ) {
    // 查询条件
    const where =
      status === undefined
        ? {
            [Op.or]: [
              {
                title: {
                  [Op.like]: `%${keywords}%`,
                },
              },
              {
                content: {
                  [Op.like]: `%${keywords}%`,
                },
              },
            ],
          }
        : {
            [Op.or]: [
              {
                title: {
                  [Op.like]: `%${keywords}%`,
                },
              },
              {
                content: {
                  [Op.like]: `%${keywords}%`,
                },
              },
            ],
            status,
          };
    const { rows: list, count: total } =
      await this.photoService.photoModel.findAndCountAll({
        where,
        limit,
        offset,
        order: desc ? [["createdAt", "desc"]] : [["createdAt", "asc"]],
      });
    return {
      list,
      total,
    };
  }
}
