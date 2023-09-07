export default {
  forbiddenError: '无权访问!',
  tokenError: 'token不合法!',
  tokenEmpty: '未携带token!',
  auditError: '审核状态不合法!',
  roleError: '此用户角色不支持访问该接口!',
  noExist: (name: string) => `此id的${name}不存在`,
  paramsError: (name: string) => `参数${name}不合法!`,
  notFound: (name: string) => `未找到该${name}!`
}