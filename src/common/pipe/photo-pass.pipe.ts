import { BadRequestException, NotFoundException, PipeTransform } from "@nestjs/common";
import { Photo } from "../../modules/photo/model/photo.model";
import tips from "../tips";
import { AuditStatusList } from "../../types/photo";

/**
 * 照片审核通过管道
 */
export class PhotoPassPipe implements PipeTransform<string, Promise<number>>{
  private photoModel: typeof Photo
  constructor() {
    this.photoModel = Photo
  }
  async transform(pid: string) {
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
    if (photo.status === AuditStatusList.Pass) {
      // 审核通过的照片
      return _pid
    } else {
      throw new BadRequestException(tips.photoIsNotAudit)
    }
  }
}