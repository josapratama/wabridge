import { Module } from "@nestjs/common";
import { RepositoriesModule } from "../../repositories/repositories.module";
import { ProviderConfigsController } from "./provider-configs.controller";
import { ProviderConfigsService } from "./provider-configs.service";
import { ProviderRoutingService } from "../provider-routing/provider-routing.service";
import { ProvidersModule } from "../providers/providers.module";

@Module({
  imports: [RepositoriesModule, ProvidersModule],
  controllers: [ProviderConfigsController],
  providers: [ProviderConfigsService, ProviderRoutingService],
  exports: [ProviderConfigsService],
})
export class ProviderConfigsModule {}
