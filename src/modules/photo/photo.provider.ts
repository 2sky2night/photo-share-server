import { Provider } from "@nestjs/common";
import { Photo } from "./model/photo.model";
import { UserLikePhoto } from "./model/user-like-photo.model";

export const photoProvider: Provider[] = [
  {
    provide: 'PhotoModel',
    useValue: Photo
  },
  {
    provide: 'UserLikePhotoModel',
    useValue: UserLikePhoto
  }
]