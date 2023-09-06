import { BadRequestException, PipeTransform } from "@nestjs/common";
import { AuditStatus, AuditStatusList } from "../../types/photo";

/**
 * 照片审核状态管道
 */
export class StatusPipe implements PipeTransform<string | undefined, AuditStatus> {
  transform(value: string | undefined): AuditStatus {    
    if (value === undefined) {
      // 默认查找审核通过的
      return AuditStatusList.Pass
    }
    const status = +value
    if (isNaN(status)) {
      throw new BadRequestException('审核状态不合法!')
    }
    if (status !== AuditStatusList.NoPass &&
      status !== AuditStatusList.Pass &&
      status !== AuditStatusList.NotAudit) {
      throw new BadRequestException('审核状态不合法!')
    }
    return status
  }
}