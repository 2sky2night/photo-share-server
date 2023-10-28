import { BadRequestException, PipeTransform } from "@nestjs/common";
import tips from "../tips";

/**
 * limit管道 （可选）
 */
export class LimitPipe implements PipeTransform<string | undefined, number> {
  transform(value: string | undefined) {
    if (value === undefined) {
      // 默认limit为20
      return 20
    }
    const limit = parseInt(value)
    if (isNaN(limit)) {
      throw new BadRequestException(tips.paramsError('limit'))
    }
    if (limit < 0) {
      throw new BadRequestException(tips.paramsError('limit'))
    }
    return limit
  }
}