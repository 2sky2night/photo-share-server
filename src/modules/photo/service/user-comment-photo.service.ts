import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { UserCommentPhoto } from "../model/user-comment-photo";
import { CommentCreateDto } from "../dto/comment-create.dto";
import { UserLikeComment } from "../model/user-like-comment.model";
import tips from "../../../common/tips";

@Injectable()
export class UserCommentPhotoService {
  constructor(
    /**
     * 用户评论照片模型
     */
    @Inject('UserCommentPhotoModel') private UCPModel: typeof UserCommentPhoto,
    /**
     * 用户点赞评论的模型
     */
    @Inject('UserLikeCommentModel') private ULCModel: typeof UserLikeComment
  ) { }
  /**
   * 创建评论
   * @param uid 评论作者 
   * @param pid 评论的目标照片
   * @param commentCreateDto 评论体内容 
   */
  async createComment(uid: number, pid: number, { content }: CommentCreateDto) {
    // @ts-ignore
    const comment = this.UCPModel.build({ pid, uid, content })
    await comment.save()
    return comment
  }
  /**
   * 用户点赞评论
   * @param uid 用户id
   * @param cid 评论id
   * @returns 
   */
  async createLike(uid: number, cid: number) {
    const flag = await this.findLike(uid, cid)
    if (flag) {
      // 已经点过赞了
      throw new BadRequestException(tips.likeError('评论'))
    }
    // @ts-ignore
    return await this.ULCModel.create({ uid, cid })
  }
  /**
   * 取消评论
   * @param uid 用户id
   * @param cid 评论id
   */
  async removeLike(uid: number, cid: number) {
    const flag = await this.findLike(uid, cid)
    if (flag === null) {
      throw new BadRequestException(tips.removeLikeError('评论'))
    }
    await flag.destroy()
  }
  /**
   * 查询点赞评论的记录
   * @param uid 用户id
   * @param cid 评论的id
   * @returns 
   */
  async findLike(uid: number, cid: number) {
    const flag = await this.ULCModel.findOne({ where: { uid, cid } })
    return flag
  }
  /**
   * 查询评论被点赞的数量
   */
  async findLikeCount(cid: number) {
    return (await this.ULCModel.findAll({ where: { cid } })).length
  }

}