import { Provider } from "@nestjs/common";
import { Photo } from "./model/photo.model";
import { UserLikePhoto } from "./model/user-like-photo.model";
import { UserCommentPhoto } from "./model/user-comment-photo";
import { UserLikeComment } from "./model/user-like-comment.model";

export const photoProvider: Provider[] = [
  {
    provide: 'PhotoModel',
    useValue: Photo
  },
  {
    provide: 'UserLikePhotoModel',
    useValue: UserLikePhoto
  },
  {
    provide: 'UserCommentPhotoModel',
    useValue: UserCommentPhoto
  },
  {
    provide: 'UserLikeCommentModel',
    useValue: UserLikeComment
  }
]