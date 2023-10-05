import {
  InternalServerErrorException,
  NotFoundException,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import tips from "../tips";

export function StaticImgMiddleware(req: Request, res: Response, next: any) {
  if (req.path.startsWith("/static")) {
    // 静态资源路径是否存在?
    const rootPath = path.resolve("./src/static");
    if (!fs.existsSync(rootPath)) {
      res.status(500).json({
        code: 500,
        msg: "Internal Server Error",
        timestamp: Date.now(),
      });
      Logger.error("服务器未挂载静态图片资源!");
    } else {
      // 截取路径
      // 并将url编码解码，解决中文字符被转码，导致路径与实际存储的路径不一致导致读取不到对应文件
      // 因为发送请求时会自动把url中某些字符转码，导致中文字符被转码，不能读取到对应的文件
      const staticPath = decodeURI(req.path.substring(7));
      // 拼接路径
      const filePath = path.resolve("./src/static", `./${staticPath}`);
      // 若文件存在
      if (fs.existsSync(filePath)) {
        // 每次读取100kb的数据
        const rs = fs.createReadStream(filePath, {
          highWaterMark: 1024 * 100,
          autoClose: true,
        });
        // 每次读取数据，通过可写流写入res响应内容中
        rs.on("data", (chuck: Buffer) => {
          res.write(chuck);
        });
        rs.on("end", () => {
          res.end();
        });
        rs.on("error", () => {
          throw new InternalServerErrorException(tips.staticFileError);
        });
        // 设置响应头部为图片类型，若不设置响应体类型返回二进制文件会直接下载文件，这样设置会被解析成图片文件了
        res.setHeader("content-type", "image/jpeg");
        // 设置强缓存 12小时
        res.setHeader("cache-control", "max-age=43200");
      } else {
        console.log(`Error:Can not found path:${filePath}`);
        throw new NotFoundException(tips.staticFileNotFound);
      }
    }
  } else {
    next();
  }
}
