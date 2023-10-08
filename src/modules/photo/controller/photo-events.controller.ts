import {
  Controller,
  Get,
  Inject,
  UseGuards,
  Res,
  Query,
  ParseUUIDPipe,
  BadRequestException,
} from "@nestjs/common";
import { AuthGuard, RoleGuard } from "../../../common/guard";
import { Role, Token } from "../../../common/decorator";
import { Roles } from "../../auth/role";
import { Response } from "../../../common/response";
import type { Response as ResType } from "express";
import type { EventEmitter } from "node:events";
import { randomUUID } from "crypto";
import { PhotoAuditDto } from "../dto";
import tips from "../../../common/tips";

@Controller("/photo/events")
export class PhotoEventsController {
  constructor(
    @Inject("Pubsub") private Pubsub: EventEmitter,
    /**
     * 订阅审核结果频道的session
     */
    @Inject("UserSubscribeAuditList")
    private subscribers: { sessionId: string; uid: number; count: number }[]
  ) {}
  /**
   * User订阅审核推送频道
   **/
  @Role(Roles.User)
  @UseGuards(AuthGuard, RoleGuard)
  @Get("/subscribe")
  subscribeEvent(
    // 哪个用户订阅的频道?
    @Token("sub") uid: number
  ) {
    // 查询当前用户是否已经订阅过审核推送的频道了
    const item = this.subscribers.find((ele) => ele.uid === uid);
    if (item) {
      // 若当前用户已经订阅过该频道了,直接返回uuid
      item.count++;
      return item.sessionId;
    } else {
      const sessionId = randomUUID();
      this.subscribers.push({ sessionId, uid, count: 1 });
      return sessionId;
    }
  }
  /**
   * 建立推送频道连接
   */
  @Get("/connect")
  createEvent(
    @Query("sessionId", ParseUUIDPipe) sessionId: string,
    @Res() res: ResType
  ) {
    // 审核成功的回调
    const handleAudit = (
      photo: { pid: number; uid: number } & PhotoAuditDto
    ) => {
      // 若当前照片作者订阅了频道，就通过sessionID推送相应事件
      const item = this.subscribers.find((ele) => ele.uid === photo.uid);
      if (item) {
        // 作者订阅了频道，就通过sessionId推送
        res.write(`event:${item.sessionId}\n`);
        res.write(`id:${item.sessionId}\n`);
        res.write(`data:${JSON.stringify(new Response(photo))}\n\n`);
      }
    };

    this.Pubsub.on("audit-result", handleAudit);

    res.header("Connection", "keep-alive");
    res.header("Cache-Control", "no-cache");
    res.header("Content-Type", "text/event-stream");

    res.write(`event:${sessionId}\n`);
    res.write(`id:${sessionId}\n`);
    res.write(
      `data:${JSON.stringify(new Response(null, 200, "连接成功!"))}\n\n`
    );
  }
  /**
   * User取消订阅审核结果推送频道
   */
  @Role(Roles.User)
  @UseGuards(AuthGuard, RoleGuard)
  @Get("/unsubscribe")
  unSubsribeEvent(@Token("sub") uid: number) {
    const index = this.subscribers.findIndex((ele) => ele.uid === uid);
    if (index === -1) {
      // 还未订阅过该频道
      throw new BadRequestException(tips.unsubscribeNotFound);
    } else {
      const item = this.subscribers[index];
      item.count--;
      if (item.count === 0) {
        // 若当前用户无订阅数量，移除该用户的订阅频道
        this.subscribers.splice(index, 1);
      }
      return null;
    }
  }
}
