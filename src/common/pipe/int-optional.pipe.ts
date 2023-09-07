import { BadRequestException, PipeTransform } from "@nestjs/common";

export class IntOptionalPipe implements PipeTransform<string, number | undefined> {
  transform(value: string) {
    if (value === undefined) {
      return undefined
    }
    const num = +value
    if (isNaN(num)) {
      throw new BadRequestException('参数不合法!')
    }
    return num
  }
}