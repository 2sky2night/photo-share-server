import { Global, Module } from "@nestjs/common";
import {
  AuthModule,
  PhotoModule,
  FileModule,
  DatabaseModule,
  SearchModule,
  JWTModule,
} from "./modules";

@Global()
@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    PhotoModule,
    FileModule,
    SearchModule,
    JWTModule,
  ],
  controllers: [],
  providers: [],
  exports: [DatabaseModule],
})
export class AppModule {}
