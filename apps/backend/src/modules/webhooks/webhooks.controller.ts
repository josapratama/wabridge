import {
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import type { VerifyWebhookQuery } from "../../common/types";
import { WebhooksService } from "./webhooks.service";

@Controller("webhooks")
export class WebhooksController {
  constructor(private readonly service: WebhooksService) {}

  /**
   * GET /webhooks/:providerType
   * Handles webhook verification challenge (e.g., Meta hub.challenge)
   */
  @Get(":providerType")
  async verify(
    @Param("providerType") providerType: string,
    @Query() query: VerifyWebhookQuery,
  ): Promise<string> {
    return this.service.verifyWebhook(providerType as never, query);
  }

  /**
   * POST /webhooks/:providerType
   * Handles incoming webhook events from the provider
   */
  @Post(":providerType")
  async handle(
    @Param("providerType") providerType: string,
    @Req() req: { body: unknown },
    @Headers() headers: Record<string, string>,
  ): Promise<{ processed: number }> {
    return this.service.handleWebhook(providerType as never, req.body, headers);
  }
}
