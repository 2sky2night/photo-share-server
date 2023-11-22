import { Response } from "../../common/response";
import { createReadStream, existsSync } from "node:fs";
import { resolve } from "node:path";
import type { Response as ResType, Request } from "express";
/**
 * 将对象中值为undefined属性去除掉
 * @param object
 */
export const removeUndefined = <T extends Record<string, any>>(object: T) => {
  // @ts-ignore
  Reflect.ownKeys(object).forEach((key: keyof T) => {
    if (object[key] === undefined) {
      Reflect.deleteProperty(object, key);
    }
  });
  return object;
};

/**
 * 响应静态资源
 * @param request 请求上下文
 * @param response 响应上下文
 * @param rootPath 请求根路径
 */
export const responseFile = (req: Request, res: ResType, rootPath: string) => {
  const filePath = resolve(rootPath, `.${req.path}`);
  if (existsSync(filePath)) {
    // 静态资源缓存强缓存10天
    res.setHeader("cache-control", "max-age=864000");
    // 设置响应体类型
    if (req.path.includes(".ico")) {
      res.setHeader("content-type", "image/x-icon");
    } else if (req.path.includes(".js")) {
      res.setHeader("content-type", "text/javascript");
    } else if (req.path.includes(".css")) {
      res.setHeader("content-type", "text/css");
    } else if (req.path.includes(".svg")) {
      res.setHeader("content-type", "image/svg+xml");
    }
    createReadStream(filePath).pipe(res);
  } else {
    res.status(404);
    res.send(new Response(null, 404, `该文件未找到!`));
  }
};
