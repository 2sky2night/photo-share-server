import { BadRequestException, NotFoundException, PipeTransform } from "@nestjs/common";
import { Photo } from "../../modules/photo/model/photo.model";

export class PhotoPipe implements PipeTransform<string, number> {
  private photoModel: typeof Photo
  constructor() {
    this.photoModel = Photo
  }
  transform(pid: string) {
    // value为传入的值,该函数返回啥则被修饰的参数就会是什么
    // 解析pid
    const _pid = +pid
    if (isNaN(_pid)) {
      throw new BadRequestException('照片的id必须是一个数字!')
    }
    // 查询pid在数据库中是否存在
    const photo = this.photoModel.findByPk(_pid)
    if (photo === null) {
      throw new NotFoundException('此id的照片不存在!')
    }
    return _pid
  }
}