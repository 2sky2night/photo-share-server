import { Provider } from "@nestjs/common";
import { Photo } from "./model/photo.model";
import { UserLikePhoto } from "./model/user-like-photo.model";
import { UserCommentPhoto } from "./model/user-comment-photo";
import { UserLikeComment } from "./model/user-like-comment.model";
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
