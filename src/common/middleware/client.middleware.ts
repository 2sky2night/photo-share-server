import { createReadStream, existsSync } from "node:fs";
import { resolve } from "node:path";
import { Response } from "../response";
import type { Request, Response as ResType, NextFunction } from "express";
import { responseFile } from "../../utils/tools";
import { Logger } from "@nestjs/common";

/**
 * 前端页面静态资源中间件
 * @param req
 * @param res
 * @param next
 */
export function ClientMiddleware(
  req: Request,
  res: ResType,
  next: NextFunction
) {
  if (req.path.startsWith("/api")) {
    // 访问接口
    next();
  } else {
    // 访问静态资源
    const rootPath = resolve(__dirname, "../../client");
    if (existsSync(rootPath)) {
      if (req.path === "/favicon.ico" || req.path.includes("/assets")) {
        // 访问静态资源
        responseFile(req, res, rootPath);
      } else {
        // 访问页面
        const clientPath = resolve(rootPath, "./index.html");
        if (existsSync(clientPath)) {
          createReadStream(clientPath).pipe(res);
        } else {
          res.status(404);
          res.send(new Response(null, 404, "index.html文件未找到!"));
        }
      }
    } else {
      res.status(500).json({
        code: 500,
        msg: "Internal Server Error",
        timestamp: Date.now(),
      });
      new Logger().error("服务器未挂载client资源!");
    }
  }
}
