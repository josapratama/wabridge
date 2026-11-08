import { Module } from "@nestjs/common";
import { AutoReplyService } from "./auto-reply.service";
import { AutoReplyController } from "./auto-reply.controller";
import { RepositoriesModule } from "../../repositories/repositories.module";

@Module({
  imports: [RepositoriesModule],
  providers: [AutoReplyService],
  controllers: [AutoReplyController],
  exports: [AutoReplyService],
})
export class AutoReplyModule {}
