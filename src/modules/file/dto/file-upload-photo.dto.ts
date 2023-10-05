/**
 * 文件数据
 */
export class FileUploadDto<P extends string> {
  fieldname: P;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}