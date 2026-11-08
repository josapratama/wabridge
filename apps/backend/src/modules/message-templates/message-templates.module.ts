import { Module } from "@nestjs/common";
import { MessageTemplatesService } from "./message-templates.service";
import { MessageTemplatesController } from "./message-templates.controller";
import { RepositoriesModule } from "../../repositories/repositories.module";

@Module({
  imports: [RepositoriesModule],
  providers: [MessageTemplatesService],
  controllers: [MessageTemplatesController],
  exports: [MessageTemplatesService],
})
export class MessageTemplatesModule {}
