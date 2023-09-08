import { BadRequestException, NotFoundException, PipeTransform } from "@nestjs/common";
import tips from "../tips";
import { UserCommentPhoto } from "../../modules/photo/model/user-comment-photo";

/**
 * 评论管道，评论必须存在才能放行!
 */
export class CommentPipe implements PipeTransform<string | undefined, Promise<number>>{
  UCPModel = UserCommentPhoto
  async transform(value: string | undefined): Promise<number> {
    if (value === undefined) {
      throw new BadRequestException(tips.paramsEmpty('cid'))
    }
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