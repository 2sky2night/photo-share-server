import { InternalServerErrorException, NotFoundException, Logger } from "@nestjs/common";
import { Request, Response } from "express";
import fs from 'fs'
import path from 'path'
export async function StaticImgMiddleware(req: Request, res: Response, next: any) {

  if (req.path.substring(0, 7) === '/static') {
    // 静态资源路径是否存在?
    const rootPath = path.resolve('./src/static')
    if (!fs.existsSync(rootPath)) {
      res.status(500).json({
        code: 500,
        msg: 'Internal Server Error',
        timestamp: Date.now()
      })
      Logger.error('服务器未挂载静态图片资源!')
    } else {
      // 截取路径
      // 并将url编码解码，解决中文字符被转码，导致路径与实际存储的路径不一致导致读取不到对应文件
      // 因为发送请求时会自动把url中某些字符转码，导致中文字符被转码，不能读取到对应的文件
      const staticPath = decodeURI(req.path.substring(7))
      // 拼接路径
      const filePath = path.resolve('./src/static', `.${staticPath}`)
      // 若文件存在
      if (fs.existsSync(filePath)) {
        const fileData = await new Promise((resolve) => {
          const bufferArray: Buffer[] = []
          // 每次读取100kb的数据
          const rs = fs.createReadStream(filePath, { highWaterMark: 1024 * 100 })
          // 每次读取数据时保存该文件片段
          rs.on('data', (chuck: Buffer) => {
            bufferArray.push(chuck)
          })
          rs.on('end', () => {
            resolve(Buffer.concat(bufferArray))
          })
          rs.on('error', () => {
            throw new InternalServerErrorException('读取文件失败!')
          })
        })
        // 设置响应头部为图片类型，若不设置响应体类型返回二进制文件会直接下载文件，这样设置会被解析成图片文件了
        res.setHeader('content-type', 'image/jpeg')

        res.send(fileData)
      } else {
        throw new NotFoundException('静态资源不存在!')
      }

    }

  } else {
    next()
  }
}