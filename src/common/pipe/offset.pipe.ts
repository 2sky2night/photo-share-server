import { BadRequestException, PipeTransform } from "@nestjs/common";
import tips from "../tips";

/**
 * offset管道 （可选）
 */
export class OffsetPipe implements PipeTransform<string | undefined, number> {
  transform(value: string | undefined) {
    if (value === undefined) {
      // 默认offset为0
      return 0
    }
    const offset = parseInt(value)
    if (isNaN(offset)) {
      throw new BadRequestException(tips.paramsError('offset'))
    }
    if (offset < 0) {
      throw new BadRequestException(tips.paramsError('offset'))
    }
    return offset
  }
}