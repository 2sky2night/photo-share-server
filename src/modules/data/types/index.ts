/**
 * 聚合函数的结果
 */
export type CountResult = { total: number }[];

/**
 * 获取各个标签下的照片数量的结果
 */

export type TagsPhotoCountResult = {
  tid: number;
  name_en: string;
  name_zh: string;
  total: number;
}[];

/**
 * 统计照片的浏览量的结果
 */
export type PhotoViewsResult = { pid: number; title: string; views: number }[];

/**
 * 用户发布数量的结果
 */
export type UserPostPhotoCountResult = {
  username: string;
  uid: number;
  total: number;
}[];
