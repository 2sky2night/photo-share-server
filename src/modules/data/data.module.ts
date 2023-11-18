import { Module } from "@nestjs/common";
import { DataController } from "./controllers";
import { DataService } from "./services";
import { DatabaseModule } from "../../database/database.module";

@Module({
  imports: [DatabaseModule],
  providers: [DataService],
  controllers: [DataController],
})
export class DataModule {}
