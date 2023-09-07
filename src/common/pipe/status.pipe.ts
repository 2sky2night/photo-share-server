import { BadRequestException, PipeTransform } from "@nestjs/common";
import { AuditStatus, AuditStatusList } from "../../types/photo";
import tips from "../tips";

/**
 * 照片审核状态管道
 */
export class StatusPipe implements PipeTransform<string | undefined, AuditStatus | undefined> {
  transform(value: string | undefined): AuditStatus | undefined {
    if (value === undefined) {
      // 默认查找全部状态的照片
      return undefined
    }
    const status = +value
    if (isNaN(status)) {
      throw new BadRequestException(tips.auditError)
    }
    if (status !== AuditStatusList.NoPass &&
      status !== AuditStatusList.Pass &&
      status !== AuditStatusList.NotAudit) {
      throw new BadRequestException(tips.auditError)
    }
    return status
  }
}