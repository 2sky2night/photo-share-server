import { Module } from "@nestjs/common";
import {
  AuthModule,
  PhotoModule,
  FileModule,
  DatabaseModule,
  SearchModule,
} from "./modules";

@Module({
  imports: [DatabaseModule, AuthModule, PhotoModule, FileModule, SearchModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
