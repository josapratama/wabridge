import { Module } from "@nestjs/common";
import { AppLogger } from "../../common/logger/app.logger";
import { ProvidersModule } from "../providers/providers.module";
import { ProviderRoutingService } from "./provider-routing.service";

@Module({
  imports: [ProvidersModule],
  providers: [AppLogger, ProviderRoutingService],
  exports: [ProviderRoutingService],
})
export class ProviderRoutingModule {}
