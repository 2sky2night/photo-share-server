import { Global, Module } from "@nestjs/common";
import {
  AuthModule,
  PhotoModule,
  FileModule,
  DatabaseModule,
  SearchModule,
} from "./modules";

@Global()
@Module({
  imports: [DatabaseModule, AuthModule, PhotoModule, FileModule, SearchModule],
  controllers: [],
  providers: [],
  exports: [DatabaseModule],
})
export class AppModule {}
