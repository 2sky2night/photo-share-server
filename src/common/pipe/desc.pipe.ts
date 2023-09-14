import { ArgumentMetadata, BadRequestException, PipeTransform } from "@nestjs/common";
import tips from "../tips";

/**
 * 升序或降序管道 (可选)
 */
export class DescPipe implements PipeTransform<"true" | "false", boolean>{
  transform(value: "true" | "false"): boolean {
    if (value === undefined) {
      // 默认降序
      return true
    }
    if (value !== 'false' && value !== 'true') {
      throw new BadRequestException(tips.paramsError('desc'))
    }
    return value === 'true'
  }
}