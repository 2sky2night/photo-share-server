import {
  BadRequestException,
  PipeTransform,
} from "@nestjs/common";
import tips from "../tips";

/**
 * 数值型列表
 */
export class NumListPipe implements PipeTransform<string, number[]> {
  transform(value: string): number[] {
    const numList = value.split(",");
    return numList.map((ele) => {
      const _value = +ele;
      if (isNaN(_value)) {
        throw new BadRequestException(tips.paramsError(""));
      } else {
        return _value;
      }
    });
  }
}
