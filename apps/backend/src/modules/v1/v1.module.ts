import { Module } from "@nestjs/common";
import { V1MessagesController } from "./v1-messages.controller";
import { ApiKeysModule } from "../api-keys/api-keys.module";
import { MessagesModule } from "../messages/messages.module";
import { BroadcastModule } from "../broadcast/broadcast.module";
import { RateLimitModule } from "../rate-limit/rate-limit.module";
import { IpWhitelistModule } from "../ip-whitelist/ip-whitelist.module";
import { SessionsModule } from "../sessions/sessions.module";

@Module({
  imports: [
    ApiKeysModule,
    MessagesModule,
    BroadcastModule,
    RateLimitModule,
    IpWhitelistModule,
    SessionsModule,
  ],
  controllers: [V1MessagesController],
})
export class V1Module {}
