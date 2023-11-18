import { Global, Module } from "@nestjs/common";
import {
  AuthModule,
  PhotoModule,
  FileModule,
  DatabaseModule,
  SearchModule,
  JWTModule,
} from "./modules";
import { DataModule } from "./modules/data/data.module";

@Global()
@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    PhotoModule,
    FileModule,
    SearchModule,
    JWTModule,
    DataModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
