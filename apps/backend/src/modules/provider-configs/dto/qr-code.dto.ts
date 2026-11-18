import { IsString, IsOptional, IsBoolean } from "class-validator";

export class QrCodeDto {
  @IsOptional()
  @IsString()
  qrCode?: string;

  @IsOptional()
  @IsBoolean()
  isConnected?: boolean;
}
