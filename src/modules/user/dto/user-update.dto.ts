import { Length, IsString } from "class-validator";

export class UserUpdateDto {
  @Length(1, 13, { message: '用户名称长度为1-13位!' })
  @IsString({ message: '用户名称必须是一个字符串!' })
  readonly username: string;
  @IsString({ message: '用户头像链接必须是一个字符串' })
  readonly avatar: string;
}