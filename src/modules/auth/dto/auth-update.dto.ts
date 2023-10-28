import { Length, IsString, IsOptional } from "class-validator";

export class AuthUpdateDto {
  @IsOptional()
  @Length(1, 13, { message: "用户名称长度为1-13位!" })
  @IsString({ message: "用户名称必须是一个字符串!" })
  readonly username?: string;
  @IsOptional()
  @IsString({ message: "用户头像链接必须是一个字符串" })
  readonly avatar?: string;
  @IsOptional()
  @Length(6, 14, { message: "密码长度为6-14位!" })
  @IsString({ message: "密码必须是一个字符!" })
  password?: string;
}
