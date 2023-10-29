import { IsString, Length } from "class-validator";

export class UserUpdatePasswordDto {
  @Length(6, 14, { message: "密码长度为6-14位!" })
  @IsString({ message: "密码必须是一个字符串!" })
  password!: string;
  @Length(6, 14, { message: "旧密码长度为6-14位!" })
  @IsString({ message: "旧密码必须是一个字符串!" })
  oldPassword!: string;
}
