import { Injectable, NotFoundException } from "@nestjs/common";
import { AppLogger } from "../../common/logger/app.logger";
import { PROVIDER_TYPES } from "../../common/constants";
import type { ProviderType } from "../../common/types";
import { WhatsAppProvider } from "../providers/whatsapp-provider.interface";
import { MetaCloudWhatsAppProvider } from "../providers/meta-cloud/meta-cloud.provider";
import { BspWhatsAppProvider } from "../providers/bsp/bsp.provider";
import { BaileysWhatsAppProvider } from "../providers/baileys/baileys.provider";

@Injectable()
export class ProviderRoutingService {
  constructor(
    private readonly metaCloudProvider: MetaCloudWhatsAppProvider,
    private readonly bspProvider: BspWhatsAppProvider,
    private readonly baileysProvider: BaileysWhatsAppProvider,
    private readonly logger: AppLogger,
  ) {}

  getProvider(providerType: ProviderType): WhatsAppProvider {
    this.logger.logStructured(
      "debug",
      `Routing to provider: ${providerType}`,
      {},
      "ProviderRoutingService",
    );

    switch (providerType) {
      case PROVIDER_TYPES.META_CLOUD:
        return this.metaCloudProvider;
      case PROVIDER_TYPES.BSP:
        return this.bspProvider;
      case PROVIDER_TYPES.BAILEYS:
        return this.baileysProvider;
      default:
        throw new NotFoundException(
          `No provider registered for type: ${providerType}`,
        );
    }
  }

  getAvailableProviders(): ProviderType[] {
    return [
      PROVIDER_TYPES.META_CLOUD,
      PROVIDER_TYPES.BSP,
      PROVIDER_TYPES.BAILEYS,
    ];
  }
}
