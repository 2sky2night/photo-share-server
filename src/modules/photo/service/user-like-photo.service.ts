import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PhotoService } from "./photo.service";
import { Photo, UserLikePhoto } from "../model";
import tips from "../../../common/tips";

@Injectable()
export class UserLikePhotoService {
  constructor(
    private photoService: PhotoService,
    @Inject("PhotoModel") private photoModel: typeof Photo,
    @Inject("UserLikePhotoModel")
    private userLikePhotoModel: typeof UserLikePhoto
  ) {}
  /**
   * 插入记录
   * @param uid 用户id
   * @param pid 照片id
   * @returns
   */
  async create(uid: number, pid: number) {
    // 查询照片是否存在
    await this.photoService.findPhoto(pid);
    // 查询点赞状态
    const flag = await this.find(uid, pid);
    if (flag === null) {
      // @ts-ignore
      await this.userLikePhotoModel.create({ uid, pid });
      return;
    } else {
      throw new BadRequestException(tips.likeError("照片"));
    }
  }
  /**
   * 删除记录
   * @param uid 用户id
   * @param pid 照片id
   */
  async delete(uid: number, pid: number) {
    // 查询照片是否存在
    await this.findPhoto(pid);
    // 查询点赞状态
    const flag = await this.find(uid, pid);
    if (flag) {
      await this.userLikePhotoModel.destroy({ where: { uid, pid } });
      return;
    } else {
      throw new BadRequestException(tips.removeLikeError("照片"));
    }
  }
  /**
   * 某个用户对照片的点赞状态
   * @param uid 用户id
   * @param pid 照片id
   * @returns 是否有该点赞信息?
   */
  async find(uid: number, pid: number) {
    return await this.userLikePhotoModel.findOne({ where: { uid, pid } });
  }
  /**
   * 查询图片，必定查找到
   * @param pid 图片id
   */
  async findPhoto(pid: number) {
    const photo = this.photoModel.findByPk(pid);
    if (photo === null) {
      throw new NotFoundException("此id的照片不存在!");
    }
    return photo;
  }
  /**
   * 查询用户点赞的照片id列表
   * @param uid 用户id
   * @param limit 长度
   * @param offset 偏移量
   * @param desc 根据创建时间降序或升序
   */
  async getUserLikePid(
    uid: number,
    limit: number,
    offset: number,
    desc: boolean
  ) {
    const list = await this.userLikePhotoModel.findAll({
      attributes: ["pid"],
      where: {
        uid,
      },
      limit,
      offset,
      // 对createdAt排序
      order: desc ? [["createdAt", "desc"]] : [["createdAt", "asc"]],
    });
    return list.map((ele) => ele.pid);
  }
  /**
   * 根据照片id列表返回照片列表的基本信息
   * @param pidList
   */
  getPhotoBase(pidList: number[]) {
    return Promise.all(
      pidList.map(async (pid) => {
        return await this.photoService.findPhoto(pid);
      })
    );
  }
  /**
   * 获取用户点赞的照片列表
   * @param uid
   * @param currentUid
   * @param limit
   * @param offset
   * @param desc
   * @returns
   */
  async getUserLikePhotoList(
    uid: number,
    currentUid: number | undefined,
    limit: number,
    offset: number,
    desc: boolean
  ) {
    // 获取点赞的照片id列表
    const pidList = await this.getUserLikePid(uid, limit, offset, desc);
    // 根据id列表获取照片详情
    const listBase = await this.getPhotoBase(pidList);
    // 查询照片的详情信息
    const list = await this.photoService.getPhotosInfo(listBase, currentUid);
    // 获取点赞总数
    const total = await this.userLikePhotoModel.count({ where: { uid } });
    return {
      list,
      offset,
      limit,
      desc,
      has_more: limit + offset < total,
    };
  }
}
