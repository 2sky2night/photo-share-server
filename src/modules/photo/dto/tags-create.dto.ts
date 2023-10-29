import { IsOptional, IsString, Length } from "class-validator";

export class TagsCreateDto {
  @Length(1, 255, { message: "标签中文为1-255位!" })
  @IsString({ message: "标签中文必须是一个字符串!" })
  nameZH!: string;

  @Length(1, 255, { message: "标签英文长度为1-255位!" })
  @IsString({ message: "标签英文必须是一个字符串!" })
  nameEN!: string;

  @Length(1, 255, { message: "标签中文描述长度为1-255位!" })
  @IsString({ message: "标签中文描述必须是一个字符串!" })
  @IsOptional()
  descriptionZH?: string;

  @Length(1, 255, { message: "标签英文描述长度为1-255位!" })
  @IsString({ message: "标签英文描述必须是一个字符串!" })
  @IsOptional()
  descriptionEN?: string;
}
