import { Module } from "@nestjs/common";
import { RepositoriesModule } from "../../repositories/repositories.module";
import { SessionsController } from "./sessions.controller";
import { SessionsService } from "./sessions.service";
import { SessionStartupService } from "./session-startup.service";
import { ProviderRoutingModule } from "../provider-routing/provider-routing.module";
import { AppLogger } from "../../common/logger/app.logger";

@Module({
  imports: [RepositoriesModule, ProviderRoutingModule],
  controllers: [SessionsController],
  providers: [SessionsService, SessionStartupService, AppLogger],
  exports: [SessionsService],
})
export class SessionsModule {}
