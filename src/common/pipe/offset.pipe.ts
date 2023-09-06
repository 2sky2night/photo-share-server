import { BadRequestException, PipeTransform } from "@nestjs/common";

/**
 * offset管道
 */
export class OffsetPipe implements PipeTransform<string | undefined, number> {
  transform(value: string | undefined) {
    if (value === undefined) {
      // 默认offset为0
      return 0
    }
    const offset = parseInt(value)
    if (isNaN(offset)) {
      throw new BadRequestException('offset必须为数字型!')
    }
    if (offset < 0) {
      throw new BadRequestException('offset必须为正数!')
    }
    return offset
  }
}