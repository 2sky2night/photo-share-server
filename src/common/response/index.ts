/**
 * 响应体基本格式
 */
export class Response<D = any> {
  data: D;
  code: number;
  msg: string;
  constructor(data: D, code = 200, msg = "ok") {
    this.data = data;
    this.code = code;
    this.msg = msg;
  }
}
