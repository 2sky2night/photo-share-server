import { BadRequestException, PipeTransform } from "@nestjs/common";

/**
 * limit管道
 */
export class LimitPipe implements PipeTransform<string | undefined, number> {
  transform(value: string | undefined) {
    if (value === undefined) {
      // 默认limit为20
      return 20
    }
    const limit = parseInt(value)
    if (isNaN(limit)) {
      throw new BadRequestException('limit必须为数字型!')
    }
    if (limit < 0) {
      throw new BadRequestException('limit为正数!')
    }
    return limit
  }
}