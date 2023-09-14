import { Controller, ParseFilePipe, Post, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { FileUploadPhotoDto } from "./dto/file-upload-photo.dto";
import crypto from 'crypto'
import path from 'path'
import fs from 'fs'
import sizeOf from 'image-size'
import { AuthGuard } from "../../common/guard";

@Controller('file')
export class FileController {
  /**
   * 上传单图片
   */
  // 登录了才能上传图片!
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('photo'))
  @Post('/upload/photo')
  async uploadPhoto(@UploadedFile(ParseFilePipe) fileUploadPhotoDto: FileUploadPhotoDto) {
    // 静态资源根路径
    const rootPath = path.resolve('./src/static')

    // 校验静态资源文件是否存在
    // 图片路径
    const imgPath = path.resolve(rootPath, './img')
    const rootFlag = fs.existsSync(rootPath)
    if (!rootFlag) {
      // 不存在根路径 
      // 创建根路径文件夹
      fs.mkdirSync(rootPath)
      // 创建img文件夹
      fs.mkdirSync(imgPath)
    } else {
      // 存在根路径
      const imgFlag = fs.existsSync(imgPath)
      if (!imgFlag) {
        // 不存在img路径
        fs.mkdirSync(imgPath)
      }
    }
    // 读取该图片的尺寸大小
    const { height, width } = sizeOf(fileUploadPhotoDto.buffer)
    // 生成新文件名称
    let newName = `${crypto.randomUUID({ disableEntropyCache: true })}_w${width}_h${height}_${fileUploadPhotoDto.originalname}`
    // 清空文件名称的空格
    while (newName.includes(' ')) {
      newName = newName.replace(' ', '_')
    }
    // 新文件路径
    const filePath = path.resolve(imgPath, `./${newName}`)
    // 保存文件
    await new Promise<void>((resolve, reject) => {

      // 创建文件流
      const writeStream = fs.createWriteStream(filePath)
      // 写入数据
      writeStream.write(fileUploadPhotoDto.buffer, (err) => {
        // 本次写入是否成功?
        if (err) {
          reject()
        } else {
          resolve()
        }
      })

    })

    // 返回图片链接地址
    return `/static/img/${newName}`
  }
}