import { Controller, DefaultValuePipe, Get, Query } from "@nestjs/common";
import { SearchCommentService } from "../service";
import { TokenOptional } from "../../../common/decorator";
import { DescPipe, LimitPipe, OffsetPipe } from "../../../common/pipe";

@Controller("search/comment")
export class SearchCommentController {
  constructor(private searchCommentService: SearchCommentService) {}
  /**
   * 搜索评论
   */
  @Get("")
  async userSeachComment(
    @TokenOptional("sub") currentUid: number | undefined,
    @Query("keywords", new DefaultValuePipe("")) keywords: string,
    @Query("offset", OffsetPipe) offset: number,
    @Query("limit", LimitPipe) limit: number,
    @Query("desc", DescPipe) desc: boolean
  ) {
    return await this.searchCommentService.search(
      currentUid,
      keywords,
      offset,
      limit,
      desc
    );
  }
}
