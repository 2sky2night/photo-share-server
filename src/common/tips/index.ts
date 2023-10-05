export default {
  forbiddenError: "无权访问!",
  tokenError: "token不合法!",
  tokenEmpty: "未携带token!",
  auditError: "审核状态不合法!",
  roleError: "此用户角色不支持访问该接口!",
  photoIsNotAudit: "此照片未经过审核!",
  requestError: "请求非法!",
  usernameIsExist: "用户名重复!",
  usernameNoExist: "用户名不存在!",
  loginError: "用户名或密码错误!",
  staticFileNotFound: "静态资源不存在!",
  staticFileError: "读取静态资源出错!",
  oldPasswordError: "当前密码错误!",
  pleaseUploadImg:'请上传图片!',
  /**
   * @example `参数${name}缺失!`
   */
  paramsEmpty: (name: string) => `参数${name}缺失!`,
  /**
   * @example `还未点赞过该${name}！`
   */
  removeLikeError: (name: string) => `还未点赞过该${name}!`,
  /**
   * @example `已经点赞过该${name}了!`
   */
  likeError: (name: string) => `已经点赞过该${name}了!`,
  /**
   * @example `此id的${name}不存在!`
   */
  noExist: (name: string) => `此id的${name}不存在`,
  /**
   * @example `参数${name}不合法`
   */
  paramsError: (name: string) => `参数${name}不合法!`,
  /**
   * @example `未找到该${name}`
   */
  notFound: (name: string) => `未找到该${name}!`,
};
