import { BadRequestException, NotFoundException, PipeTransform } from "@nestjs/common";
import { Photo } from "../../modules/photo/model/photo.model";
import tips from "../tips";

/**
 * 照片存在管道
 */
export class PhotoPipe implements PipeTransform<string | undefined, Promise<number>> {
  private photoModel: typeof Photo
  constructor() {
    this.photoModel = Photo
  }
  async transform(pid: string | undefined) {
    if (pid === undefined) {
      throw new BadRequestException(tips.paramsEmpty('pid'))
    }
    // value为传入的值,该函数返回啥则被修饰的参数就会是什么
    // 解析pid
    const _pid = +pid
    if (isNaN(_pid)) {
      throw new BadRequestException(tips.paramsError('pid'))
    }
    // 查询pid在数据库中是否存在
    const photo = await this.photoModel.findByPk(_pid)
    if (photo === null) {
      throw new NotFoundException(tips.notFound('照片'))
    }
    return _pid
  }
}