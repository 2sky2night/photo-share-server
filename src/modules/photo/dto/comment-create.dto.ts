import { IsString, Length } from "class-validator";

export class CommentCreateDto {
  @Length(1, 255, { message: '评论内容长度为1-255位!' })
  @IsString({ message: '评论内容必须是一个字符串!' })
  content!: string
}