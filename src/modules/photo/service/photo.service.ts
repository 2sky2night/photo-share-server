import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { EventEmitter } from "node:events";
import sequelize from "sequelize";
import tips from "../../../common/tips";
import { AuditStatus, AuditStatusList } from "../../../types/photo";
import { removeUndefined } from "../../../utils/tools";
import { Roles } from "../../auth/role";
import { UserService } from "../../user/user.service";
import { PhotoAuditDto } from "../dto";
import { UserCommentPhoto, UserLikePhoto, Photo } from "../model";

@Injectable()
export class PhotoService {
  constructor(
    readonly userService: UserService,
    @Inject("Pubsub") readonly Pubsub: EventEmitter,
    @Inject("PhotoModel") readonly photoModel: typeof Photo,
    @Inject("UserLikePhotoModel")
    readonly userLikePhotoModel: typeof UserLikePhoto,
    @Inject("UserCommentPhotoModel")
    readonly userCommentPhotoModel: typeof UserCommentPhoto,
    @Inject("UserSubscribeAuditList")
    readonly subscribers: { sessionId: string; uid: number }[]
  ) {}
  /**
   * 发布照片
   * @param uid 发布者id
   * @param photoCreateDto 请求体
   */
  async create(
    uid: number,
    photoCreateDto: { title: string; content: string; photos: any }
  ) {
    // @ts-ignore
    const photo = this.photoModel.build({
      title: photoCreateDto.title,
      content: photoCreateDto.content,
      photos: JSON.stringify(photoCreateDto.photos),
      publish_uid: uid,
    });
    await photo.save();
    return photo;
  }
  /**
   * 审核照片
   * @param pid 照片id
   * @param uid 审核员id
   * @param photoAuditDto 审核状态
   */
  async auditPhoto(pid: number, uid: number, photoAuditDto: PhotoAuditDto) {
    const photo = await this.findPhoto(pid);
    if (photo.audit_uid) {
      // 有人审核了
      throw new BadRequestException("此照片已经被审核了!");
    }
    photo.status = photoAuditDto.status;
    photo.audit_desc = photoAuditDto.desc ? photoAuditDto.desc : null;
    photo.audit_time = new Date();
    photo.audit_uid = uid;
    await photo.save();
    // 审核结果推送
    this.emitAuditResult(photo, photoAuditDto);
    return void 0;
  }
  /**
   * 管理员获取照片
   * @param uid 指定作者
   * @param stauts 指定状态
   * @param offset 起始偏移量
   * @param limit 获取多少数据
   * @param desc 是否降序
   */
  async adminFindPhotos(
    uid: number | undefined,
    status: AuditStatus | undefined,
    offset: number,
    limit: number,
    desc: boolean
  ) {
    // 照片列表
    const { rows, count } = await this.photoModel.findAndCountAll({
      where: removeUndefined({ publish_uid: uid, status }),
      order: [["createdAt", desc ? "desc" : "asc"]],
      offset,
      limit,
    });
    const list = await Promise.all(
      rows.map(async (photo) => {
        const photoData = this.formatPhoto(photo);
        const user = await this.userService.findUserWithoutPasswordAndRole(
          photo.publish_uid
        );
        return {
          ...photoData,
          user,
        };
      })
    );
    return {
      list,
      total: count,
      limit,
      offset,
      has_more: count > offset + limit,
    };
  }
  /**
   * 用户查看照片
   * @param uid
   * @param status
   * @param offset
   * @param limit
   * @param currentUid
   */
  async userFindPhotos(
    uid: number | undefined,
    status: AuditStatus | undefined,
    offset: number,
    limit: number,
    currentUid: number | undefined,
    desc: boolean
  ) {
    await this.accessuserFindPhotos(currentUid, uid, status);
    // 照片列表
    const { rows, count: total } = await this.photoModel.findAndCountAll({
      where: removeUndefined({ publish_uid: uid, status }),
      order: desc ? [["createdAt", "DESC"]] : [],
      offset,
      limit,
    });

    const list = await this.getPhotosInfo(rows, currentUid);

    return {
      list,
      limit,
      offset,
      total,
      has_more: total > offset + limit,
      desc,
    };
  }
  /**
   * 浏览照片数据上报
   * @param pid
   */
  async viewPhoto(pid: number) {
    const photo = await this.findPhoto(pid);
    photo.views++;
    await photo.save();
  }
  /**
   * 分页浏览该用户发布的照片(准备废弃)
   * @param uid 作者id
   * @param offset 起始偏移量
   * @param limit  获取长度
   * @param status 状态
   * @param currentUid 当前登录的用户
   * 未登录，则status只能是1
   * 登录了
   * 1.是普通用户，若查看的是自己的照片则status为任意值，若查看别人的则stauts只能为1
   * 2.是超级管理员，查看任意状态的数据
   */
  async findAuthorPhotos(
    uid: number,
    offset: number,
    limit: number,
    status: AuditStatus | undefined,
    currentUid: number | undefined
  ) {
    // 保证作者是否存在在
    const user = await this.userService.findUser(uid);
    // 若作者不是User
    if (user.role !== Roles.User) {
      throw new BadRequestException("此用户非User角色!");
    }
    // 校验调用权限
    await this.accessGetAuthorPhotos(currentUid, uid, status);
    // 查询总数
    const total = await this.getAuthorPhotosLength(uid, status);
    // 获取初始数据
    const photos = await this.photoModel.findAll({
      where:
        status === undefined
          ? {
              publish_uid: user.uid,
            }
          : {
              publish_uid: user.uid,
              status,
            },
      offset,
      limit,
    });

    // 格式化photos字段
    const list = photos.map((photo) => this.formatPhoto(photo));
    // 根据用户角色判断是否查询照片被点赞数量
    if (status !== 1) {
      // 非审核通过的或全部照片，不需要查询点赞数量
      return {
        list,
        total,
        limit,
        offset,
        has_nore: total < offset + limit,
      };
    } else {
      // 若查看审核通过的照片
      // 获取用户角色
      const user =
        currentUid !== undefined
          ? await this.userService.findUser(currentUid)
          : undefined;
      // 若是User则需要查询用户对照片的点赞状态
      const needCheckLike =
        user === undefined || user.role !== Roles.User ? false : true;
      // 若查看的是审核通过的照片，需要查找照片点赞状态，以及点赞数量
      const _list = await Promise.all(
        list.map(async (photo) => {
          // 获取该照片被点赞的数量
          const likeCount = await this.getLikePhotos(photo.pid);
          // 获取当前用户的点赞状态
          const is_liked = needCheckLike
            ? Boolean(await this.findLike(uid, photo.pid))
            : false;
          return {
            ...photo,
            like_count: likeCount,
            is_liked,
          };
        })
      );
      return {
        list: _list,
        total,
        limit,
        offset,
        has_nore: total < offset + limit,
      };
    }
  }
  /**
   * 获取某个照片
   * @param pid
   * @param uid
   */
  async getPhoto(pid: number, uid: number | undefined) {
    const photo = await this.accountAccessPhoto(pid, uid);
    const data = await this.getPhotoInfo(photo, uid);
    return data;
  }
  /**
   * 获取一些照片
   * @param pids
   * @param uid
   * @returns
   */
  async getPhotos(pids: number[], uid: number | undefined) {
    return await Promise.all(
      pids.map((pid) => {
        return this.getPhoto(pid, uid);
      })
    );
  }
  /**
   * 随机获取审核通过照片的图片
   * @param num 获取的数量
   */
  async randomImgList(limit: number) {
    // 随机获取照片
    const photos = await this.photoModel.findAll({
      where: {
        status: AuditStatusList.Pass,
      },
      order: sequelize.literal("rand()"), // 随机排序
      limit,
    });
    // 照片列表
    const list: any[] = [];
    photos.forEach((photo) => {
      JSON.parse(photo.photos).forEach((ele: any) => {
        list.push(ele);
      });
    });
    // 若实际没有获取到请求数量的图片，则循环获取，直至将数组长度铺满成请求数量limit
    const nowCount = list.length;
    if (list.length < limit) {
      let i = nowCount;
      while (i < limit) {
        list.push(list[i % nowCount]);
        i++;
      }
    }
    return {
      list,
      count: nowCount,
      limit,
    };
  }
  /**--------业务封装的分割线-------*/
  /**
   * 审核结果推送
   * @param photo
   * @param photoAuditDto
   */
  emitAuditResult(photo: Photo, photoAuditDto: PhotoAuditDto) {
    // 若当前审核的照片作者订阅了审核推送结果就推送消息
    const item = this.subscribers.findIndex(
      (ele) => ele.uid === photo.publish_uid
    );
    if (item !== undefined) {
      // 当前订阅中有作者，就推送消息
      this.Pubsub.emit("audit-result", {
        pid: photo.pid,
        uid: photo.publish_uid,
        ...photoAuditDto,
      });
    }
  }
  /**
   * 根据账户获取照片信息
   * @param photo 照片
   * @param uid 当前登录的用户
   */
  async getPhotoInfo(photo: Photo, uid: undefined | number) {
    // 查询照片作者的信息
    const user = await this.userService.findUserWithoutPasswordAndRole(
      photo.publish_uid
    );
    // 获取照片被用户喜欢的数量
    const like_count = (await photo.getLikeds()).length;
    // 当前用户是否喜欢此照片?
    const is_liked = await this.findUserLikePhoto(photo.pid, uid);
    const data = this.formatPhoto(photo);
    // 获取评论的数量
    const comment_count = await this.getPhotoCommentCount(photo.pid);
    return {
      ...data,
      user,
      like_count,
      is_liked,
      comment_count,
    };
  }
  /**
   * 用户是否可以访问该照片?
   * @param pid
   * @param uid
   */
  async accountAccessPhoto(pid: number, uid: number | undefined) {
    const photo = await this.findPhoto(pid);
    if (uid === undefined) {
      // 未登录
      if (photo.status !== AuditStatusList.Pass) {
        // 访问未通过的照片
        throw new ForbiddenException(tips.forbiddenError);
      }
    } else {
      // 登录
      const user = await this.userService.findUser(uid);
      if (photo.status !== AuditStatusList.Pass) {
        // 访问未通过照片
        if (user.role === Roles.User && user.uid !== photo.publish_uid) {
          // 非作者且不是管理员
          throw new ForbiddenException(tips.forbiddenError);
        }
      }
    }
    return photo;
  }
  /**
   * 当前用户是否可以调用userFindPhotos服务？
   * @param currentUid 当前登录的id
   * @param uid 作者
   * @param status 照片状态
   */
  async accessuserFindPhotos(
    currentUid: number | undefined,
    uid: undefined | number,
    status: AuditStatus | undefined
  ) {
    if (currentUid === undefined) {
      // 未登录用户
      if (status !== AuditStatusList.Pass) {
        // 访问非通过的照片
        throw new ForbiddenException(tips.forbiddenError);
      } else {
        // 访问通过的照片
        return;
      }
    } else {
      // 登录用户
      if (status !== AuditStatusList.Pass) {
        // 登录用户访问非通过照片
        if (currentUid === uid) {
          // 访问自己的照片
          return;
        } else {
          // 访问非自己的照片
          throw new ForbiddenException(tips.forbiddenError);
        }
      } else {
        // 访问通过的照片
        return;
      }
    }
  }
  /**
   * 获取照片列表的详情数据
   * @param photos 照片列表
   * @param uid 当前登录的用户id
   * @returns
   */
  async getPhotosInfo(photos: Photo[], uid: number | undefined) {
    const list = await Promise.all(
      photos.map(async (row) => {
        return this.getPhotoInfo(row, uid);
      })
    );
    return list;
  }
  /**
   * 用户是否点赞过照片
   * @param pid 照片id
   * @param uid 用户id
   * @returns
   */
  async findUserLikePhoto(pid: number, uid: number | undefined) {
    if (uid === undefined) return false;
    const row = await this.userLikePhotoModel.findOne({ where: { pid, uid } });
    return row === null ? false : true;
  }
  /**
   * 获取用户的发照片数量
   * @param publish_uid 作者id
   * @param status 状态  undefined则访问所有状态的照片
   */
  async getAuthorPhotosLength(
    publish_uid: number,
    status: AuditStatus | undefined
  ) {
    await this.userService.findUser(publish_uid);
    return (
      await this.photoModel.findAll({
        where: status === undefined ? { publish_uid } : { publish_uid, status },
      })
    ).length;
  }
  /**
   * 控制findAuthorPhotos访问权限
   * 1.未登录用户只能访问审核通过的照片
   * 2.User角色只能查看自己所有的照片和他人审核通过的照片
   * 3.管理员可以查看所有照片
   * 4.status若为undefined则访问全部状态的照片，只有用户自身和管理员才能访问
   * @param currentUid 登录的用户
   * @param uid 作者id
   * @param status 审核状态，undefined为访问所有状态的照片列表
   * @returns
   */
  async accessGetAuthorPhotos(
    currentUid: number | undefined,
    uid: number,
    status: AuditStatus | undefined
  ) {
    // 保证uid存在

    if (currentUid === undefined) {
      // 未登录
      if (status === AuditStatusList.Pass) {
        // 访问通过的照片
        return true;
      } else {
        // 除审核通过以外的照片
        throw new ForbiddenException("无权访问!");
      }
    } else {
      // 登录了
      // 获取登录用户的角色
      const { role } = await this.userService.findUser(currentUid);
      if (role === Roles.SuperAdmin || role === Roles.Admin) {
        // 管理员和超级管理员随意访问资源
        return true;
      } else {
        // 普通用户
        if (
          status === AuditStatusList.NotAudit ||
          status === AuditStatusList.NoPass ||
          status === undefined
        ) {
          // 未审核和未通过的和全部
          if (currentUid === uid) {
            // 是用户本身访问自己的照片
            return true;
          } else {
            // 非用户本身访问自己的照片
            throw new ForbiddenException("无权访问!");
          }
        } else {
          // 审核通过的
          return true;
        }
      }
    }
  }
  /**
   * 获取照片的评论数量
   * @param pid 已经审核通过的照片
   */
  async getPhotoCommentCount(pid: number) {
    return (await this.userCommentPhotoModel.findAll({ where: { pid } }))
      .length;
  }
  /**
   * 格式化照片的photos字段，返回处理后的照片项
   * @param photo
   */
  formatPhoto(photo: Photo) {
    return {
      pid: photo.pid,
      title: photo.title,
      content: photo.content,
      photos: JSON.parse(photo.photos),
      publish_uid: photo.publish_uid,
      audit_uid: photo.audit_uid,
      audit_desc: photo.audit_desc,
      audit_time: photo.audit_time,
      status: photo.status,
      createdAt: photo.createdAt,
      updatedAt: photo.updatedAt,
      views: photo.views,
    };
  }
  /**
   * 某个用户对照片的点赞状态
   * @param uid 用户id
   * @param pid 照片id 照片必须存在
   * @returns 是否有该点赞信息?
   */
  async findLike(uid: number, pid: number) {
    return await this.userLikePhotoModel.findOne({ where: { uid, pid } });
  }
  /**
   * 获取照片被点赞的数量
   * @param pid  照片id，必须保证照片存在
   */
  async getLikePhotos(pid: number) {
    // 查询照片被点赞的数量
    return (await this.userLikePhotoModel.findAll({ where: { pid } })).length;
  }
  /**
   * 查询照片（不一定有该照片）
   * @param pid 照片id
   */
  async find(pid: number) {
    return await this.photoModel.findByPk(pid);
  }
  /**
   * 查询照片
   * @param pid 照片id
   * @returns 照片示例
   */
  async findPhoto(pid: number) {
    const photo = await this.find(pid);
    if (photo === null) {
      throw new NotFoundException(tips.noExist("照片"));
    }
    return photo;
  }
  /**
   * 获取照片列表
   * @param limit 长度
   * @param offset 偏移量
   * @param desc 降序
   */
  async getPhotoList(limit: number, offset: number, desc: boolean) {
    const { rows: list, count: total } = await this.photoModel.findAndCountAll({
      limit,
      offset,
      order: [["createdAt", desc ? "desc" : "asc"]],
    });
    return {
      list: list.map((item) => this.formatPhoto(item)),
      limit,
      offset,
      desc,
      has_more: total > limit + offset,
    };
  }
}
