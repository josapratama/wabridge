import { Module } from "@nestjs/common";
import { ScheduledMessagesService } from "./scheduled-messages.service";
import { ScheduledMessagesController } from "./scheduled-messages.controller";
import { RepositoriesModule } from "../../repositories/repositories.module";
import { MessagesModule } from "../messages/messages.module";

@Module({
  imports: [RepositoriesModule, MessagesModule],
  providers: [ScheduledMessagesService],
  controllers: [ScheduledMessagesController],
  exports: [ScheduledMessagesService],
})
export class ScheduledMessagesModule {}
