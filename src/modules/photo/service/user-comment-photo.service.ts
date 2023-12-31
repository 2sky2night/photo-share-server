import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { UserCommentPhoto } from "../model/user-comment-photo.model";
import { CommentCreateDto } from "../dto/comment-create.dto";
import { UserLikeComment } from "../model";
import tips from "../../../common/tips";
import { UserService } from "../../user/user.service";
import { Roles } from "../../auth/role";
import { Op } from "sequelize";

@Injectable()
export class UserCommentPhotoService {
  constructor(
    /**
     * 用户评论照片模型
     */
    @Inject("UserCommentPhotoModel") readonly UCPModel: typeof UserCommentPhoto,
    /**
     * 用户点赞评论的模型
     */
    @Inject("UserLikeCommentModel") readonly ULCModel: typeof UserLikeComment,
    private userService: UserService
  ) {}
  /**
   * 创建评论
   * @param uid 评论作者
   * @param pid 评论的目标照片
   * @param commentCreateDto 评论体内容
   */
  async createComment(uid: number, pid: number, { content }: CommentCreateDto) {
    // @ts-ignore
    const comment = this.UCPModel.build({ pid, uid, content });
    await comment.save();
    return comment;
  }
  /**
   * 用户点赞评论
   * @param uid 用户id
   * @param cid 评论id
   * @returns
   */
  async createLike(uid: number, cid: number) {
    const flag = await this.findLike(uid, cid);
    if (flag) {
      // 已经点过赞了
      throw new BadRequestException(tips.likeError("评论"));
    }
    // @ts-ignore
    return await this.ULCModel.create({ uid, cid });
  }
  /**
   * 取消点赞评论
   * @param uid 用户id
   * @param cid 评论id
   */
  async removeLike(uid: number, cid: number) {
    const flag = await this.findLike(uid, cid);
    if (flag === null) {
      throw new BadRequestException(tips.removeLikeError("评论"));
    }
    await flag.destroy();
  }
  /**
   * 是否有该评论
   * @param cid 评论id
   * @param hasDele 查询是否被删除的记录
   */
  async findComment(cid: number, hasDele = false) {
    // 若hasDele会false，只查询没被删除的记录，为true查询所有记录
    // paranoid为假，会查询所有的记录，为真查询没被删除的记录
    return await this.UCPModel.findByPk(cid, { paranoid: !hasDele });
  }
  /**
   * 删除评论
   * @param cid
   */
  async removeComment(cid: number) {
    const comment = await this.findComment(cid);
    if (comment) {
      await comment.destroy();
    } else {
      throw new NotFoundException(tips.notFound("评论"));
    }
  }
  /**
   * 恢复评论
   * @param cid
   */
  async restoreComment(cid: number) {
    const comment = await this.findComment(cid, true);
    if (comment) {
      if (comment.deletedAt) {
        // 被删除过的评论
        await comment.restore();
      } else {
        // 没被删除的评论
        throw new BadRequestException(tips.notDeleteError("评论"));
      }
    } else {
      throw new NotFoundException(tips.notFound("评论"));
    }
  }
  /**
   * 获取评论列表
   * @param keywords 搜索关键词 （可选）
   * @param pid 照片id （可选）
   * @param uid 用户id （可选）
   * @param isDele 查询所有记录、查询被删除的记录、查询没被删除的记录 （可选）
   * @param limit 长度（可选）
   * @param offset  偏移量（可选）
   * @param desc 降序 （可选）
   * @returns
   */
  async adminGetComment(
    keywords: string | undefined,
    pid: number | undefined,
    uid: number | undefined,
    isDele: boolean | undefined,
    limit: number,
    offset: number,
    desc: boolean
  ) {
    const where: Record<string, any> = {};

    // 筛选条件
    if (keywords) {
      where.content = {
        [Op.like]: `%${keywords}%`,
      };
    }
    if (pid !== undefined) {
      where.pid = pid;
    }
    if (uid !== undefined) {
      where.uid = uid;
    }
    if (isDele === true) {
      // 只查询被删除的记录
      where.deletedAt = {
        [Op.not]: null,
      };
    }

    const { rows, count } = await this.UCPModel.findAndCountAll({
      where,
      limit,
      offset,
      order: [["createdAt", desc ? "desc" : "asc"]],
      paranoid: isDele === undefined ? false : !isDele,
    });

    return {
      list: rows,
      total: count,
      limit,
      offset,
      desc,
      has_more: count > limit + offset,
    };
  }
  /**
   * 获取某个评论(管理员调用)
   * @param cid 当前评论的id
   * @param currentUid 当前登录的用户
   */
  async getComment(cid: number) {
    const comment = await this.find(cid, true);
    return await this.getCommentInfo(comment, undefined);
  }
  /**
   * 用户获取照片评论
   * @param pid 照片id
   * @param offset 偏移量
   * @param limit 长度
   * @param currentUid 当前登录的用户
   * @returns 评论列表
   */
  async getComments(
    pid: number,
    offset: number,
    limit: number,
    currentUid: number | undefined,
    desc: boolean
  ) {
    const { rows, count: total } = await this.UCPModel.findAndCountAll({
      where: { pid },
      offset,
      limit,
      order: desc ? [["createdAt", "desc"]] : [],
    });
    // 当前登录的用户
    let uid: number | undefined = undefined;
    if (currentUid) {
      // 登录了用户,查询是否是管理员
      // 管理员查询评论不需要查询对评论的点赞状态
      const user = await this.userService.findUser(currentUid);
      if (user.role === Roles.User) {
        // 是用户查看该接口
        uid = user.uid;
      }
    }
    // 用户传入uid，若是管理员uid为undefined，为了不查询账户对评论的点赞状态
    const list = await this.getCommentsInfo(rows, uid);
    return {
      list,
      total,
      limit,
      desc,
      offset,
      has_more: total > offset + limit,
    };
  }
  /**
   * 获取评论详情信息，包括当前用户是否点赞
   * @param comments 评论列表
   * @param currentUid 当前登录的id
   * @returns 详情信息列表
   */
  async getCommentsInfo(
    comments: UserCommentPhoto[],
    currentUid: number | undefined
  ) {
    return await Promise.all(
      comments.map((item) => this.getCommentInfo(item, currentUid))
    );
  }
  /**
   * 查询评论的详情信息
   * @param comment 评论项
   * @param currentUid 当前登录的用户
   * @returns
   */
  async getCommentInfo(
    comment: UserCommentPhoto,
    currentUid: number | undefined
  ) {
    // 查询评论点赞数量
    const like_count = await this.findLikeCount(comment.cid);
    // 查询当前用户是否点赞
    const is_liked = await this.findUserLikeComment(currentUid, comment.cid);
    // 查询评论的作者
    const user = await this.userService.findUserWithoutPasswordAndRole(
      comment.uid
    );
    return {
      ...comment.dataValues,
      like_count,
      is_liked,
      user,
    };
  }
  /**
   * 用户是否点赞过评论
   * @param uid 用户id
   * @param cid 评论id
   * @returns 布尔值
   */
  async findUserLikeComment(uid: number | undefined, cid: number) {
    if (uid === undefined) return false;
    const flag = await this.findLike(uid, cid);
    if (flag === null) {
      return false;
    } else {
      return true;
    }
  }
  /**
   * 查询点赞评论的记录
   * @param uid 用户id
   * @param cid 评论的id
   * @returns 元组
   */
  async findLike(uid: number, cid: number) {
    const flag = await this.ULCModel.findOne({ where: { uid, cid } });
    return flag;
  }
  /**
   * 查询评论被点赞的数量
   */
  async findLikeCount(cid: number) {
    return (await this.ULCModel.findAll({ where: { cid } })).length;
  }
  /**
   * 查找某个评论
   * @param cid 评论id
   * @param hasDele 是否包含被删除的评论
   */
  async find(cid: number, hasDele = true) {
    const comment = await this.findComment(cid, hasDele);
    if (comment) {
      return comment;
    } else {
      throw new NotFoundException(tips.notFound("评论"));
    }
  }
}
