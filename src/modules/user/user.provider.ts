import { Provider } from "@nestjs/common";
import { User } from "./model";

export const userProvider: Provider[] = [
  {
    provide: "UserModel",
    useValue: User,
  },
];
