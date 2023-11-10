import { Provider } from "@nestjs/common";
import {
  Photo,
  UserLikePhoto,
  UserCommentPhoto,
  UserLikeComment,
  PhotoTags,
  PhotoWithTags,
} from "./model";
import { EventEmitter } from "node:events";

export const photoProvider: Provider[] = [
  {
    provide: "PhotoModel",
    useValue: Photo,
  },
  {
    provide: "UserLikePhotoModel",
    useValue: UserLikePhoto,
  },
  {
    provide: "UserCommentPhotoModel",
    useValue: UserCommentPhoto,
  },
  {
    provide: "UserLikeCommentModel",
    useValue: UserLikeComment,
  },
  {
    provide: "PhotoTagsModel",
    useValue: PhotoTags,
  },
  {
    provide: "PhotoWithTagsModel",
    useValue: PhotoWithTags,
  },
  {
    // 订阅照片审核推送的用户
    provide: "UserSubscribeAuditList",
    useValue: [],
  },
  {
    // pubsub
    provide: "Pubsub",
    useValue: new EventEmitter(),
  },
];
