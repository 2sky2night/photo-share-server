import {
  BadRequestException,
  Controller,
  InternalServerErrorException,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import crypto from "crypto";
import path from "path";
import fs from "fs";
import sizeOf from "image-size";
import { AuthGuard } from "../../common/guard";
import { FileUploadDto } from "./dto";
import tips from "../../common/tips";

@Controller("file")
export class FileController {
  /**
   * 上传单图片
   */
  // 登录了才能上传图片!
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor("photo"))
  @Post("/upload/photo")
  async uploadPhoto(
    @UploadedFile(ParseFilePipe) fileUploadPhotoDto: FileUploadDto<"photo">
  ) {
    if (!fileUploadPhotoDto.mimetype.includes("image")) {
      throw new BadRequestException(tips.pleaseUploadImg);
    }
    // 静态资源根路径
    const rootPath = path.resolve("./src/static");

    // 校验静态资源文件是否存在
    // 图片路径
    const imgPath = path.resolve(rootPath, "./img");
    const rootFlag = fs.existsSync(rootPath);
    if (!rootFlag) {
      // 不存在根路径
      // 创建根路径文件夹
      fs.mkdirSync(rootPath);
      // 创建img文件夹
      fs.mkdirSync(imgPath);
    } else {
      // 存在根路径
      const imgFlag = fs.existsSync(imgPath);
      if (!imgFlag) {
        // 不存在img路径
        fs.mkdirSync(imgPath);
      }
    }
    // 读取该图片的尺寸大小
    const { height, width } = sizeOf(fileUploadPhotoDto.buffer);
    // 生成新文件名称
    let newName = `${crypto.randomUUID({
      disableEntropyCache: true,
    })}_w${width}_h${height}_${fileUploadPhotoDto.originalname}`;
    // 替换文件名称的空格
    while (newName.includes(" ")) {
      newName = newName.replace(" ", "_");
    }
    // 新文件路径
    const filePath = path.resolve(imgPath, `./${newName}`);
    try {
      // 保存文件
      await new Promise<void>((resolve, reject) => {
        // 创建文件流
        const writeStream = fs.createWriteStream(filePath);
        // 写入数据
        writeStream.write(fileUploadPhotoDto.buffer, (err) => {
          // 本次写入是否成功?
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    } catch (error) {
      throw new InternalServerErrorException(error);
    }

    // 返回图片链接地址
    return `/static/img/${newName}`;
  }
  /**
   * 上传头像
   */
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor("avatar"))
  @Post("/upload/avatar")
  async uploadAvatar(
    @UploadedFile(ParseFilePipe) fileUploadDto: FileUploadDto<"avatar">
  ) {
    if (!fileUploadDto.mimetype.includes("image")) {
      throw new BadRequestException(tips.pleaseUploadImg);
    }
    // 静态资源文件夹根路径
    const rootPath = path.resolve("./src/static");
    // 头像静态资源根路径
    const avatarPath = path.resolve("./src/static/avatar");

    if (!fs.existsSync(rootPath)) {
      // 不存在static文件夹
      fs.mkdirSync(rootPath);
      fs.mkdirSync(avatarPath);
    }

    if (!fs.existsSync(avatarPath)) {
      // 不存在avatar文件夹
      fs.mkdirSync(avatarPath);
    }

    // 生成新文件的名称
    const fileName = `${crypto.randomUUID({
      disableEntropyCache: true,
    })}_${fileUploadDto.originalname}`;

    // 新文件的路径
    const filePath = path.resolve(avatarPath, `./${fileName}`);

    try {
      await new Promise<void>((resolve, reject) => {
        fs.writeFile(filePath, fileUploadDto.buffer, (err) => {
          if (err) reject(err);
          resolve();
        });
      });
    } catch (error) {
      throw new InternalServerErrorException(error);
    }

    return `/static/avatar/${fileName}`;
  }
}
