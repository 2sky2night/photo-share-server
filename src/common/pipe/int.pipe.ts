import { BadRequestException, PipeTransform } from "@nestjs/common";
import tips from "../tips";

export class IntPipe
  implements PipeTransform<string | undefined, number | undefined>
{
  /**
   * 错误键
   */
  errorKey?: string;
  /**
   * 是否可选，默认不可选
   */
  isOptional: boolean;
  /**
   * 无符号数
   */
  unsigned: boolean;
  constructor(
    /**
     * 错误键，传入可以有更好的错误提示
     */
    errorKey?: string,
    /**
     * 是否可选，默认不可选
     */
    isOptional = false,
    /**
     * 无符号数
     */
    unsigned = false
  ) {
    this.isOptional = isOptional;
    if (errorKey) this.errorKey = errorKey;
    this.unsigned = unsigned;
  }
  transform(value: string | undefined) {
    if (typeof value === "undefined") {
      if (this.isOptional) {
        return undefined;
      } else {
        throw new BadRequestException(
          this.errorKey ? tips.paramsError(this.errorKey) : tips.paramsError_
        );
      }
    } else {
      const _value = +value;
      if (isNaN(_value)) {
        throw new BadRequestException(
          this.errorKey ? tips.paramsError(this.errorKey) : tips.paramsError_
        );
      } else {
        if (!this.unsigned || (this.unsigned && _value >= 0)) {
          return _value;
        } else {
          throw new BadRequestException(
            this.errorKey ? tips.paramsError(this.errorKey) : tips.paramsError_
          );
        }
      }
    }
  }
}
