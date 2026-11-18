import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import { MessagesService } from "./messages.service";
import { SendMessageDto } from "./dto/send-message.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@UseGuards(JwtAuthGuard)
@Controller("messages")
export class MessagesController {
  constructor(private readonly service: MessagesService) {}

  @Post("send")
  send(@Request() req: any, @Body() dto: SendMessageDto) {
    return this.service.send(dto, req.user.id);
  }

  @Post("upload")
  async uploadMedia(
    @Body() body: { base64: string; filename: string; mimeType: string },
  ) {
    if (!body.base64) {
      return { success: false, error: "base64 payload is required" };
    }
    const fs = await import("fs/promises");
    const path = await import("path");
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    const safeName = (body.filename || "media_file")
      .replace(/[^a-zA-Z0-9._-]/g, "_");
    const filename = `${Date.now()}-${safeName}`;
    const filePath = path.join(uploadsDir, filename);

    const base64Data = body.base64.replace(/^data:.*?;base64,/, "");
    await fs.writeFile(filePath, Buffer.from(base64Data, "base64"));

    const url = `/uploads/${filename}`;
    return { success: true, url, filename, mimeType: body.mimeType };
  }

  @Get()
  findAll(
    @Request() req: any,
    @Query("sessionId") sessionId?: string,
    @Query("status") status?: string,
    @Query("direction") direction?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
    @Query("search") search?: string,
    @Query("limit") limit?: string,
  ) {
    return this.service.findFiltered({
      userId: req.user.id,
      sessionId,
      status,
      direction,
      from,
      to,
      search,
      limit: parseInt(limit ?? "100", 10),
    });
  }

  @Get(":id")
  findById(@Param("id") id: string, @Request() req: any) {
    return this.service.findById(id, req.user.id);
  }

  @Post(":id/react")
  react(
    @Param("id") id: string,
    @Body() body: { emoji: string },
    @Request() req: any,
  ) {
    return this.service.react(id, body?.emoji || "", req.user.id);
  }

  @Post(":id/unsend")
  unsend(@Param("id") id: string, @Request() req: any) {
    return this.service.unsend(id, req.user.id);
  }
}
