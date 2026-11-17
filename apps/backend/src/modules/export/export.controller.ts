import {
  Controller,
  Get,
  Query,
  Res,
  Request,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ExportService } from "./export.service";
interface FastifyReplyLike {
  header(name: string, value: string): this;
  send(payload: any): any;
}

@Controller("export")
@UseGuards(JwtAuthGuard)
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  /** GET /export/messages?format=csv&sessionId=...&status=...&direction=... */
  @Get("messages")
  async exportMessages(
    @Request() req: any,
    @Query("format") format: "csv" | "json" = "csv",
    @Query("sessionId") sessionId?: string,
    @Query("status") status?: string,
    @Query("direction") direction?: string,
    @Res() reply: FastifyReplyLike = undefined as any,
  ) {
    const result = await this.exportService.exportMessages({
      userId: req.user.id,
      format,
      sessionId,
      status,
      direction,
    });
    reply
      .header("Content-Type", result.contentType)
      .header(
        "Content-Disposition",
        `attachment; filename="${result.filename}"`,
      )
      .send(result.data);
  }

  /** GET /export/contacts?format=csv */
  @Get("contacts")
  async exportContacts(
    @Request() req: any,
    @Query("format") format: "csv" | "json" = "csv",
    @Res() reply: FastifyReplyLike = undefined as any,
  ) {
    const result = await this.exportService.exportContacts(req.user.id, format);
    reply
      .header("Content-Type", result.contentType)
      .header(
        "Content-Disposition",
        `attachment; filename="${result.filename}"`,
      )
      .send(result.data);
  }
}
