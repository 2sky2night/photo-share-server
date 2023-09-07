import { BadRequestException, NotFoundException, PipeTransform } from "@nestjs/common";
import tips from "../tips";
import { UserCommentPhoto } from "../../modules/photo/model/user-comment-photo";

/**
 * 评论管道，评论必须存在才能放行!
 */
export class CommentPipe implements PipeTransform<string, Promise<number>>{
  UCPModel = UserCommentPhoto
  async transform(value: string): Promise<number> {
    const cid = +value
    if (isNaN(cid)) {
      throw new BadRequestException(tips.paramsError('cid'))
    }
    const comment = await this.UCPModel.findByPk(cid)
    if (comment === null) {
      throw new NotFoundException(tips.noExist('评论'))
    }
    return comment.cid
  }
}