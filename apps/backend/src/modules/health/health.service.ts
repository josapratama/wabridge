import { Injectable } from "@nestjs/common";
import { ProviderRoutingService } from "../provider-routing/provider-routing.service";
import type { ProviderHealthResult } from "../../common/types";

export interface AppHealthResult {
  status: "ok" | "degraded";
  uptime: number;
  providers: ProviderHealthResult[];
}

@Injectable()
export class HealthService {
  constructor(private readonly routingService: ProviderRoutingService) {}

  async check(): Promise<AppHealthResult> {
    const providerTypes = this.routingService.getAvailableProviders();

    const providerHealthChecks = await Promise.allSettled(
      providerTypes.map(async (type) => {
        const provider = this.routingService.getProvider(type);
        return provider.getHealth();
      }),
    );

    const providers: ProviderHealthResult[] = providerHealthChecks.map(
      (result, i) => {
        if (result.status === "fulfilled") return result.value;
        return {
          healthy: false,
          providerType: providerTypes[i],
          message: "Health check threw an error",
        };
      },
    );

    const allHealthy = providers.every((p) => p.healthy);

    return {
      status: allHealthy ? "ok" : "degraded",
      uptime: process.uptime(),
      providers,
    };
  }
}
