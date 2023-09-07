import { IsString, Length } from "class-validator";

export class AuthRegiterAdminDto {
  @Length(1, 13, { message: '用户名称长度为1-13位!' })
  @IsString({ message: '用户名称必须是一个字符!' })
  username: string;
  @Length(6, 14, { message: '密码长度为6-14位!' })
  @IsString({ message: '密码必须是一个字符!' })
  password: string;
}