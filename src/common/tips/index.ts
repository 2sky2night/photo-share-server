export default {
  forbiddenError: '无权访问!',
  tokenError: 'token不合法!',
  tokenEmpty: '未携带token!',
  auditError: '审核状态不合法!',
  roleError: '此用户角色不支持访问该接口!',
  photoIsNotAudit: '此照片未经过审核!',
  /**
   * @example 还未点赞过该${name}！
   */
  removeLikeError: (name: string) => `还未点赞过该${name}!`,
  /**
   * @example 已经点赞过该${name}了!
   */
  likeError: (name: string) => `已经点赞过该${name}了!`,
  noExist: (name: string) => `此id的${name}不存在`,
  paramsError: (name: string) => `参数${name}不合法!`,
  notFound: (name: string) => `未找到该${name}!`
}