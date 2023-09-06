// 审核状态，0未审核 1审核通过 2审核不通过
export type AuditStatus = AuditStatusList.NotAudit | AuditStatusList.Pass | AuditStatusList.NoPass

export enum AuditStatusList {
  /**
   * 未审核
   */
  NotAudit = 0,
  /**
   * 审核通过
   */
  Pass = 1,
  /**
   * 审核未通过
   */
  NoPass = 2
}