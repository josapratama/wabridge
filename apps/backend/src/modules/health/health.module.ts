import { Module } from "@nestjs/common";
import { ProviderRoutingModule } from "../provider-routing/provider-routing.module";
import { HealthController } from "./health.controller";
import { HealthService } from "./health.service";

@Module({
  imports: [ProviderRoutingModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
