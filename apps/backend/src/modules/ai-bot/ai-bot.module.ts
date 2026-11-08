import { Module, Global } from "@nestjs/common";
import { AiBotService } from "./ai-bot.service";
import { AiBotController } from "./ai-bot.controller";
import { AppLogger } from "../../common/logger/app.logger";

@Global()
@Module({
  controllers: [AiBotController],
  providers: [AiBotService, AppLogger],
  exports: [AiBotService],
})
export class AiBotModule {}
