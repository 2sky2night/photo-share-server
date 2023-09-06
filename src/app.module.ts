import { Module } from '@nestjs/common'
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { PhotoModule } from './modules/photo/photo.module';
import { FileModule } from './modules/file/file.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    PhotoModule,
    FileModule
  ],
  controllers: [],
  providers: []
})
export class AppModule { }