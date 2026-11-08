import { Module } from "@nestjs/common";
import { BroadcastService } from "./broadcast.service";
import { BroadcastController } from "./broadcast.controller";
import { RepositoriesModule } from "../../repositories/repositories.module";
import { MessagesModule } from "../messages/messages.module";

@Module({
  imports: [RepositoriesModule, MessagesModule],
  providers: [BroadcastService],
  controllers: [BroadcastController],
  exports: [BroadcastService],
})
export class BroadcastModule {}
