import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { JWT_SECRET, ACCESS_TOKEN_TIME } from "../../config";
import { JWTService } from "./services";
import { JWTController } from "./controllers";

@Module({
  imports: [
    JwtModule.register({
      secret: JWT_SECRET,
      signOptions: {
        expiresIn: ACCESS_TOKEN_TIME,
      },
    }),
  ],
  controllers: [JWTController],
  providers: [JWTService],
  exports: [JWTService],
})
export class JWTModule {}
