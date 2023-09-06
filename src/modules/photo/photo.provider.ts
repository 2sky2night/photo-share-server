import { Provider } from "@nestjs/common";
import { Photo } from "./model/photo.model";

export const photoProvider: Provider[] = [
  {
    provide: 'PhotoModel',
    useValue: Photo
  }
]