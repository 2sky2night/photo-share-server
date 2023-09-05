import { Provider } from "@nestjs/common"
import { User } from "./model/user.model"

export const userProvider: Provider[] = [
  {
    provide: 'UserModel',
    useValue: User
  }
]