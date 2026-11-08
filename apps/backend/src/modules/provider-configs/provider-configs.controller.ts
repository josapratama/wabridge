import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from "@nestjs/common";
import { ProviderConfigsService } from "./provider-configs.service";
import { CreateProviderConfigDto } from "./dto/create-provider-config.dto";
import { UpdateProviderConfigDto } from "./dto/update-provider-config.dto";
import { ProviderConfig } from "../../common/types";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ProviderRoutingService } from "../provider-routing/provider-routing.service";
import { BaileysWhatsAppProvider } from "../providers/baileys/baileys.provider";
import { PROVIDER_TYPES } from "../../common/constants";
import { QrCodeDto } from "./dto/qr-code.dto";

@Controller("provider-configs")
@UseGuards(JwtAuthGuard)
export class ProviderConfigsController {
  constructor(
    private readonly service: ProviderConfigsService,
    private readonly providerRoutingService: ProviderRoutingService,
  ) {}

  @Post()
  create(@Body() dto: CreateProviderConfigDto): Promise<ProviderConfig> {
    return this.service.create(dto);
  }

  @Get()
  list(): Promise<ProviderConfig[]> {
    return this.service.findAll();
  }

  @Get(":id")
  get(@Param("id") id: string): Promise<ProviderConfig> {
    return this.service.findById(id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateProviderConfigDto,
  ): Promise<ProviderConfig> {
    return this.service.update(id, dto);
  }

  @Patch(":id/activate")
  async activate(@Param("id") id: string): Promise<ProviderConfig> {
    const config = await this.service.activate(id);
    if (config.providerType === PROVIDER_TYPES.BAILEYS) {
      const baileysProvider = this.providerRoutingService.getProvider(
        PROVIDER_TYPES.BAILEYS,
      ) as BaileysWhatsAppProvider;

      await baileysProvider.connectAccount({
        providerConfigId: config.id,
        sessionId: "",
        config,
      });
    }
    return config;
  }

  @Patch(":id/deactivate")
  async deactivate(@Param("id") id: string): Promise<ProviderConfig> {
    return this.service.deactivate(id);
  }

  @Get(":id/qr")
  async getQrCode(@Param("id") id: string): Promise<QrCodeDto> {
    const config = await this.service.findById(id);
    if (config.providerType === PROVIDER_TYPES.BAILEYS) {
      const baileysProvider = this.providerRoutingService.getProvider(
        PROVIDER_TYPES.BAILEYS,
      ) as BaileysWhatsAppProvider;
      if (
        !baileysProvider.isConnected(config.id) &&
        !baileysProvider.getQrCodeData(config.id) &&
        !baileysProvider.isConnectingState(config.id)
      ) {
        void baileysProvider.connectAccount({
          providerConfigId: config.id,
          sessionId: "",
          config,
        });
      }
      const qrCode = baileysProvider.getQrCodeData(config.id);
      return { qrCode: qrCode ?? undefined };
    }
    return { qrCode: undefined };
  }

  @Post(":id/pairing-code")
  async requestPairingCode(
    @Param("id") id: string,
    @Body() body: { phoneNumber: string },
  ): Promise<{ pairingCode?: string }> {
    const config = await this.service.findById(id);
    if (config.providerType === PROVIDER_TYPES.BAILEYS) {
      const baileysProvider = this.providerRoutingService.getProvider(
        PROVIDER_TYPES.BAILEYS,
      ) as BaileysWhatsAppProvider;
      if (
        !baileysProvider.isConnected(config.id) &&
        !baileysProvider.getQrCodeData(config.id) &&
        !baileysProvider.isConnectingState(config.id)
      ) {
        await baileysProvider.connectAccount({
          providerConfigId: config.id,
          sessionId: "",
          config,
        });
      }
      const code = await baileysProvider.requestPairingCode(
        body.phoneNumber,
        config.id,
      );
      return { pairingCode: code ?? undefined };
    }
    return { pairingCode: undefined };
  }
}
