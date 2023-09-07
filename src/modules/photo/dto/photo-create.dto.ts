import { IsArray, IsString, Length } from "class-validator";

export class PhotoCreateDto {
  @Length(1, 20, { message: '标题长度为1-20位字符!' })
  @IsString({ message: '标题为字符串!' })
  title: string;
  @Length(1, 255, { message: '照片描述长度为1-255位字符!' })
  @IsString({ message: '照片描述为字符串!' })
  content: string;
  @IsArray({ message: '照片列表为一个列表!' })
  photos: string[];
}