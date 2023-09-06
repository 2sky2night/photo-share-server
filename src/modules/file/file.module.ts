import { Module } from "@nestjs/common";
import { MulterModule } from '@nestjs/platform-express'
import { FileController } from "./file.controller";
@Module({
  imports: [
    MulterModule.register({
      limits: {
        //  限制文件大小为10mb
        fileSize: 10 * 1024 * 1024
      }
    })
  ],
  controllers: [
    FileController
  ]
})
export class FileModule { }