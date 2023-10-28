import { BadRequestException, PipeTransform } from "@nestjs/common";
import tips from "../tips";

/**
 * 解析布尔值的参数（可选）
 */
export class BooleanOptionPipe
  implements PipeTransform<"true" | "false" | undefined, boolean | undefined>
{
  paramsName: string | undefined;
  constructor(paramsName?: string) {
    this.paramsName = paramsName;
  }
  transform(value: "true" | "false" | undefined): boolean | undefined {
    if (value === undefined) {
      return undefined;
    }
    if (value === "true") {
      return true;
    } else if (value === "false") {
      return false;
    }
    throw new BadRequestException(
      this.paramsName ? tips.paramsError(this.paramsName) : tips.paramsError_
    );
  }
}
