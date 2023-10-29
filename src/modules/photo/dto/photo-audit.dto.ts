import { IsEnum, IsOptional, Length } from "class-validator"
import { AuditStatus, AuditStatusList } from "../../../types/photo"

export class PhotoAuditDto {
  @IsEnum({
    Pass: AuditStatusList.Pass,
    NoPass: AuditStatusList.NoPass
  }, { message: '审核状态只能是1、2' })
  status!: AuditStatus
  
  @IsOptional()
  @Length(1, 255, { message: '审核描述长度为1-255' })
  desc?: string;
}