import { Inject, Injectable } from "@nestjs/common";
import { Sequelize } from "sequelize-typescript";
import {
  CountResult,
  PhotoViewsResult,
  TagsPhotoCountResult,
  UserPostPhotoCountResult,
} from "../types";
import { Roles } from "../../../modules/auth/role";
import { AuditStatusList } from "../../../types/photo";

@Injectable()
export class DataService {
  constructor(@Inject("DATABASE") readonly sequelize: Sequelize) {}
  /**
   * 数据仪表盘
   * @param days 多少天前
   * @returns
   */
  async overall(days: number | undefined) {
    // 注册的用户数量
    const user_count = await this.getUserCount(days);
    // 发布照片的数量
    const photo_count = await this.getPhotoCount(days);
    // 获取评论数量
    const comment_count = await this.getCommentCount(days);
    // 获取审核数量
    const audit_count = await this.getAuditCount(days);
    return {
      photo_count,
      user_count,
      comment_count,
      audit_count,
    };
  }
  /**
   * 根据照片浏览量排序照片
   * @param days 多少天前
   * @param limit 前x条
   */
  async photoViewsList(days: number | undefined, limit: number | undefined) {
    if (days) {
      // 非当日
      const result = await this.query<PhotoViewsResult>(
        `SELECT pid,title,views from photo WHERE \`status\`=1 and DATE(createdAt) BETWEEN DATE_SUB(CURDATE(),INTERVAL ${days} DAY) and CURDATE() ORDER BY views desc ${
          limit ? `limit ${limit}` : ""
        };`
      );
      return result;
    } else {
      // 当日
      const result = await this.query<PhotoViewsResult>(
        `SELECT pid,title,views from photo WHERE \`status\`=1 and DATE(createdAt) = CURDATE() ORDER BY views desc ${
          limit ? "" : `limit ${limit};`
        }`
      );
      return result;
    }
  }
  /**
   * 获取各个标签下的照片数量（倒叙）
   * @param limit 前x条
   */
  async tagsPhotoCount(limit: number | undefined) {
    if (limit === undefined) {
      const reuslt = await this.query<TagsPhotoCountResult>(`SELECT
	photo_tags.tid,
	photo_tags.name_en,
	photo_tags.name_zh,
	result.total
FROM
	( SELECT tid, COUNT(*) AS total FROM photo_with_tags GROUP BY tid ) AS result,
	photo_tags
WHERE
	result.tid = photo_tags.tid`);
      return reuslt;
    } else {
      const result = await this.query<TagsPhotoCountResult>(`SELECT
	photo_tags.tid,
	photo_tags.name_en,
	photo_tags.name_zh,
	result.total
FROM
	(
	SELECT
		*
	FROM
		( SELECT tid, COUNT(*) AS total FROM photo_with_tags GROUP BY tid ) AS tags_count
	ORDER BY
		total DESC
		LIMIT ${limit} OFFSET 0
	) AS result,
	photo_tags
WHERE
	result.tid = photo_tags.tid`);
      return result;
    }
  }
  /**
   * 获取账户数量占比
   * @param days 多少天前，不传则为总的
   */
  async accountPortion(days: number | undefined) {
    if (days === undefined) {
      const [{ total: user_count }] = await this.query<CountResult>(
        `select count(*) as total from \`user\` where role='${Roles.User}';`
      );
      const [{ total: admin_count }] = await this.query<CountResult>(
        `select count(*) as total from \`user\` where role='${Roles.Admin}';`
      );
      const [{ total: super_admin_count }] = await this.query<CountResult>(
        `select count(*) as total from \`user\` where role='${Roles.SuperAdmin}';`
      );
      return {
        user_count,
        admin_count,
        super_admin_count,
      };
    } else {
      const [{ total: user_count }] = await this.query<CountResult>(
        `select count(*) as total from \`user\` where role='${Roles.User}' and DATE(createdAt) BETWEEN DATE_SUB(CURDATE(), INTERVAL ${days} DAY) AND CURDATE() ;`
      );
      const [{ total: admin_count }] = await this.query<CountResult>(
        `select count(*) as total from \`user\` where role='${Roles.Admin}' and DATE(createdAt) BETWEEN DATE_SUB(CURDATE(), INTERVAL ${days} DAY) AND CURDATE();`
      );
      const [{ total: super_admin_count }] = await this.query<CountResult>(
        `select count(*) as total from \`user\` where role='${Roles.SuperAdmin}' and DATE(createdAt) BETWEEN DATE_SUB(CURDATE(), INTERVAL ${days} DAY) AND CURDATE() ;`
      );
      return {
        user_count,
        admin_count,
        super_admin_count,
      };
    }
  }
  /**
   * 用户发布照片的数量统计
   * @param days 多少天前,不传就是总的
   * @param limit 前x条
   */
  async userPostPhotoCount(
    days: number | undefined,
    limit: number | undefined
  ) {
    if (days === undefined) {
      const result = await this.query<UserPostPhotoCountResult>(`SELECT
    result.*,
    \`user\`.username
  FROM
    (
    SELECT
      *
    FROM
      ( SELECT publish_uid AS uid, COUNT(*) AS total FROM photo GROUP BY publish_uid ) AS photo_result
    ORDER BY
      total DESC
      ${limit ? `limit ${limit}` : ""}
    ) AS result,
    \`user\`
  WHERE
    result.uid = \`user\`.uid`);
      return result;
    } else {
      const result = await this.query<UserPostPhotoCountResult>(`SELECT
    result.*,
    \`user\`.username
  FROM
    (
    SELECT
      *
    FROM
      ( SELECT publish_uid AS uid, COUNT(*) AS total FROM photo 
      where
        DATE(createdAt) BETWEEN DATE_SUB(CURDATE(), INTERVAL ${days} DAY) AND CURDATE()
      GROUP BY publish_uid 
       ) AS photo_result
    ORDER BY
      total DESC
      ${limit ? `limit ${limit}` : ""}
    ) AS result,
    \`user\`
  WHERE
    result.uid = \`user\`.uid`);
      return result;
    }
  }
  /**
   * 统计审核照片的比例
   * @param days 多少天前，不传则为总的
   */
  async auditPhotoPortion(days: number | undefined) {
    if (days === undefined) {
      const [{ total: no_pass }] = await this.query<CountResult>(
        `SELECT count(*) as total FROM photo WHERE \`status\`=${AuditStatusList.NoPass};`
      );
      const [{ total: pass }] = await this.query<CountResult>(
        `SELECT count(*) as total FROM photo WHERE \`status\`=${AuditStatusList.Pass};`
      );
      const [{ total: unaudit }] = await this.query<CountResult>(
        `SELECT count(*) as total FROM photo WHERE \`status\`=${AuditStatusList.NotAudit};`
      );
      return {
        no_pass,
        pass,
        unaudit,
      };
    } else {
      const [{ total: no_pass }] = await this.query<CountResult>(
        `SELECT count(*) as total FROM photo WHERE \`status\`=${AuditStatusList.NoPass} and DATE(createdAt) BETWEEN DATE_SUB(CURDATE(), INTERVAL ${days} DAY) AND CURDATE();;`
      );
      const [{ total: pass }] = await this.query<CountResult>(
        `SELECT count(*) as total FROM photo WHERE \`status\`=${AuditStatusList.Pass} and DATE(createdAt) BETWEEN DATE_SUB(CURDATE(), INTERVAL ${days} DAY) AND CURDATE();;`
      );
      const [{ total: unaudit }] = await this.query<CountResult>(
        `SELECT count(*) as total FROM photo WHERE \`status\`=${AuditStatusList.NotAudit} and DATE(createdAt) BETWEEN DATE_SUB(CURDATE(), INTERVAL ${days} DAY) AND CURDATE();;`
      );
      return {
        no_pass,
        pass,
        unaudit,
      };
    }
  }

  /**
   * 查询审核数量
   * @param days 多少天前，不传就是总的
   * @returns
   */
  async getAuditCount(days?: number) {
    const [{ total }] = await this.query<CountResult>(
      days !== undefined
        ? `SELECT count(*) as total FROM photo WHERE \`status\`!=0 and DATE(createdAt) BETWEEN DATE_SUB(CURDATE(), INTERVAL ${days} DAY) AND CURDATE();`
        : "SELECT count(*) as total FROM photo WHERE `status`!=0;"
    );
    return total;
  }
  /**
   * 查询评论的发布数量
   * @param days 多少天前，不传就是总的
   * @returns
   */
  async getCommentCount(days?: number) {
    const [{ total }] = await this.query<CountResult>(
      days !== undefined
        ? `SELECT count(*) as total FROM \`user_comment_photo\` WHERE DATE(createdAt) BETWEEN DATE_SUB(CURDATE(), INTERVAL ${days} DAY) AND CURDATE();`
        : "SELECT count(*) as total FROM `user_comment_photo`;"
    );
    return total;
  }
  /**
   * 获取用户注册数量
   * @param days 多少天前，不传就是总的
   * @returns
   */
  async getUserCount(days?: number) {
    const [{ total }] = await this.query<CountResult>(
      days !== undefined
        ? `SELECT count(*) as total FROM \`user\` WHERE DATE(createdAt) BETWEEN DATE_SUB(CURDATE(), INTERVAL ${days} DAY) AND CURDATE();`
        : "SELECT count(*) as total FROM `user`;"
    );
    return total;
  }
  /**
   * 获取照片发布数量
   * @param days 多少天前，不传就是总的
   * @returns
   */
  async getPhotoCount(days?: number) {
    const [{ total }] = await this.query<CountResult>(
      days !== undefined
        ? `SELECT count(*) as total FROM photo WHERE DATE(createdAt) BETWEEN DATE_SUB(CURDATE(), INTERVAL ${days} DAY) AND CURDATE();`
        : "SELECT count(*) as total FROM photo;"
    );
    return total;
  }
  /**
   * 查询
   * @param sqlStr sql字符串
   * @returns
   */
  async query<R = any>(sqlStr: string) {
    const [result] = await this.sequelize.query(sqlStr);
    return result as R;
  }
}
