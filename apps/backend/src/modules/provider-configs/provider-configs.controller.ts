import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
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
  create(
    @Request() req: any,
    @Body() dto: CreateProviderConfigDto,
  ): Promise<ProviderConfig> {
    return this.service.create(req.user.id, dto);
  }

  @Get()
  list(@Request() req: any): Promise<ProviderConfig[]> {
    return this.service.findAll(req.user.id);
  }

  @Get(":id")
  get(@Param("id") id: string, @Request() req: any): Promise<ProviderConfig> {
    return this.service.findById(id, req.user.id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Request() req: any,
    @Body() dto: UpdateProviderConfigDto,
  ): Promise<ProviderConfig> {
    return this.service.update(id, req.user.id, dto);
  }

  @Patch(":id/activate")
  async activate(
    @Param("id") id: string,
    @Request() req: any,
  ): Promise<ProviderConfig> {
    const config = await this.service.activate(id, req.user.id);
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
  async deactivate(
    @Param("id") id: string,
    @Request() req: any,
  ): Promise<ProviderConfig> {
    return this.service.deactivate(id, req.user.id);
  }

  @Get(":id/qr")
  async getQrCode(
    @Param("id") id: string,
    @Request() req: any,
  ): Promise<QrCodeDto> {
    const config = await this.service.findById(id, req.user.id);
    if (config.providerType === PROVIDER_TYPES.BAILEYS) {
      const baileysProvider = this.providerRoutingService.getProvider(
        PROVIDER_TYPES.BAILEYS,
      ) as BaileysWhatsAppProvider;
      const isConnected = baileysProvider.isConnected(config.id);
      if (isConnected) {
        return { isConnected: true, qrCode: undefined };
      }
      if (
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
      return { qrCode: qrCode ?? undefined, isConnected: false };
    }
    return { qrCode: undefined, isConnected: false };
  }

  @Post(":id/pairing-code")
  async requestPairingCode(
    @Param("id") id: string,
    @Request() req: any,
    @Body() body: { phoneNumber: string },
  ): Promise<{ pairingCode?: string }> {
    const config = await this.service.findById(id, req.user.id);
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
