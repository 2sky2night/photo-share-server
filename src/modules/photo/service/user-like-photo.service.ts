import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { UserLikePhoto } from "../model/user-like-photo.model";
import { PhotoService } from "./photo.service";
import { Photo } from "../model/photo.model";

@Injectable()
export class UserLikePhotoService {
  constructor(
    @Inject('PhotoModel') private photoModel: typeof Photo,
    @Inject('UserLikePhotoModel') private userLikePhotoModel: typeof UserLikePhoto,
  ) { }
  /**
   * 插入记录
   * @param uid 用户id 
   * @param pid 照片id
   * @returns 
   */
  async create(uid: number, pid: number) {
    // 查询照片是否存在
    await this.findPhoto(pid)
    // 查询点赞状态
    const flag = await this.find(uid, pid)
    if (flag === null) {
      // @ts-ignore
      await this.userLikePhotoModel.create({ uid, pid })
      return
    } else {
      throw new BadRequestException('请勿重复点赞!')
    }
  }
  /**
   * 删除记录
   * @param uid 用户id 
   * @param pid 照片id
   */
  async delete(uid: number, pid: number) {
    // 查询照片是否存在
    await this.findPhoto(pid)
    // 查询点赞状态
    const flag = await this.find(uid, pid)
    if (flag) {
      await this.userLikePhotoModel.destroy({ where: { uid, pid } })
      return
    } else {
      throw new BadRequestException('还未对该照片点过赞!')
    }
  }
  /**
   * 某个用户对照片的点赞状态
   * @param uid 用户id
   * @param pid 照片id
   * @returns 是否有该点赞信息?
   */
  async find(uid: number, pid: number) {
    return await this.userLikePhotoModel.findOne({ where: { uid, pid } })
  }
  /**
   * 查询图片，必定查找到
   * @param pid 图片id
   */
  async findPhoto(pid: number) {
    const photo = this.photoModel.findByPk(pid)
    if (photo === null) {
      throw new NotFoundException('此id的照片不存在!')
    }
    return photo
  }
}