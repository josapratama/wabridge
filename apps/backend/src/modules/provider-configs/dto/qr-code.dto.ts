import { IsString, IsOptional } from "class-validator";

export class QrCodeDto {
  @IsOptional()
  @IsString()
  qrCode?: string;
}
