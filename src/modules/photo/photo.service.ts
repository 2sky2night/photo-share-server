import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { Photo } from "./model/photo.model";
import { PhotoCreateDto } from "./dto/photo-create.dto";
import { PhotoAuditDto } from "./dto/photo-audit.dto";
import { UserService } from "../user/user.service";
import { User } from "../user/model/user.model";
import { AuditStatus, AuditStatusList } from "../../types/photo";
import { Roles } from "../auth/role";

@Injectable()
export class PhotoService {
  constructor(
    private userService: UserService,
    @Inject('UserModel') private userModel: typeof User,
    @Inject('PhotoModel') private photoModel: typeof Photo
  ) { }
  /**
   * 发布照片
   * @param uid 发布者id 
   * @param photoCreateDto 请求体
   */
  async create(uid: number, photoCreateDto: PhotoCreateDto) {
    // @ts-ignore
    const photo = this.photoModel.build({
      title: photoCreateDto.title,
      content: photoCreateDto.content,
      photos: JSON.stringify(photoCreateDto.photos),
      publish_uid: uid
    })
    await photo.save()
    return photo
  }
  /**
   * 审核照片
   * @param pid 照片id 
   * @param uid 审核员id
   * @param photoAuditDto 审核状态 
   */
  async auditPhoto(pid: number, uid: number, photoAuditDto: PhotoAuditDto) {
    const photo = await this.findPhoto(pid)
    if (photo.audit_uid) {
      // 有人审核了
      throw new BadRequestException('此照片已经被审核了!')
    }
    photo.status = photoAuditDto.status
    photo.audit_desc = photoAuditDto.desc ? photoAuditDto.desc : null
    photo.audit_time = new Date()
    photo.audit_uid = uid
    await photo.save()
  }
  /**
   * 查询照片（不一定有该照片）
   * @param pid 照片id
   */
  async find(pid: number) {
    return await this.photoModel.findByPk(pid)
  }
  /**
   * 查询照片
   * @param pid 照片id
   * @returns 照片示例 
   */
  async findPhoto(pid: number) {
    const photo = await this.find(pid)
    if (photo === null) {
      throw new NotFoundException('此id的照片不存在!')
    }
    return photo
  }
  /**
   * 获取用户的发照片数量
   * @param publish_uid 作者id
   * @param status 状态
   */
  async getAuthorPhotosLength(publish_uid: number, status: AuditStatus) {
    await this.userService.findUser(publish_uid)
    return (await this.photoModel.findAll({
      where: {
        publish_uid,
        status
      }
    })).length
  }
  /**
   * 控制接口访问权限
   * 1.未登录用户只能访问审核通过的照片
   * 2.User角色只能查看自己所有的照片和他人审核通过的照片
   * 3.管理员可以查看所有照片
   * @param currentUid 
   * @param uid 
   * @param status 
   * @returns 
   */
  async accessGetAuthorPhotos(currentUid: number | undefined, uid: number, status: AuditStatus) {
    // 保证uid存在

    if (currentUid === undefined) {
      // 未登录
      if (status === AuditStatusList.Pass) {
        // 访问通过的照片
        return true
      } else {
        // 除审核通过以外的照片
        throw new ForbiddenException('无权访问!')
      }
    } else {
      // 登录了      
      // 获取登录用户的角色
      const { role } = await this.userService.findUser(currentUid)
      if (role === Roles.SuperAdmin || role === Roles.Admin) {
        // 管理员和超级管理员随意访问资源
        return true
      } else {
        // 普通用户
        if (status === AuditStatusList.NotAudit || status === AuditStatusList.NoPass) {
          // 未审核和未通过的
          if (currentUid === uid) {
            // 是用户本身访问自己的照片
            return true
          } else {
            // 非用户本身访问自己的照片
            throw new ForbiddenException('无权访问!')
          }
        } else {
          // 审核通过的
          return true
        }
      }
    }
  }
  /**
   * 分页浏览该用户发布的照片
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
  async findAuthorPhotos(uid: number, offset: number, limit: number, status: AuditStatus, currentUid: number | undefined) {
    // 保证作者是否存在在
    const user = await this.userService.findUser(uid)
    // 若作者不是User
    if (user.role !== Roles.User) {
      throw new BadRequestException('此用户非User角色!')
    }
    await this.accessGetAuthorPhotos(currentUid, uid, status)
    const total = await this.getAuthorPhotosLength(uid, status)
    const photos = await this.photoModel.findAll({
      where:
      {
        publish_uid: user.uid,
        status
      }
      ,
      offset,
      limit
    })

    return {
      list: photos,
      total,
      limit,
      offset,
      has_nore: offset * limit + limit < total
    }
  }
}