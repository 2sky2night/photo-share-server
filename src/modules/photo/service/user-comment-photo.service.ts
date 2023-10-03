import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { UserCommentPhoto } from "../model/user-comment-photo";
import { CommentCreateDto } from "../dto/comment-create.dto";
import { UserLikeComment } from "../model/user-like-comment.model";
import tips from "../../../common/tips";
import { UserService } from "../../user/user.service";
import { Roles } from "../../auth/role";
import { PhotoService } from "./photo.service";

@Injectable()
export class UserCommentPhotoService {
  constructor(
    /**
     * 用户评论照片模型
     */
    @Inject("UserCommentPhotoModel") private UCPModel: typeof UserCommentPhoto,
    /**
     * 用户点赞评论的模型
     */
    @Inject("UserLikeCommentModel") private ULCModel: typeof UserLikeComment,
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
   * user获取评论详情信息，包括当前用户是否点赞
   * @param comments 评论列表
   * @param currentUid 当前登录的id
   * @returns 详情信息列表
   */
  async getCommentsInfo(
    comments: UserCommentPhoto[],
    currentUid: number | undefined
  ) {
    return await Promise.all(
      comments.map(async (comment) => {
        // 查询评论点赞数量
        const like_count = await this.findLikeCount(comment.cid);
        // 查询当前用户是否点赞
        const is_liked = await this.findUserLikeComment(
          currentUid,
          comment.cid
        );
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
      })
    );
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
}
