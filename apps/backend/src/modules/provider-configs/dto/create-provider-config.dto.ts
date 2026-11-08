import {
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MinLength,
  ValidateIf,
} from "class-validator";
import type { ProviderType } from "../../../common/types";

export class CreateProviderConfigDto {
  @IsEnum(["meta-cloud", "bsp", "baileys"])
  providerType!: ProviderType;

  @IsString()
  @MinLength(3)
  name!: string;

  @IsOptional()
  @ValidateIf((o) => o.baseUrl !== undefined && o.baseUrl !== "")
  @IsUrl({ require_tld: false })
  baseUrl?: string;

  @IsOptional()
  @IsString()
  apiVersion?: string;

  @IsOptional()
  @IsString()
  phoneNumberId?: string;

  @IsOptional()
  @IsString()
  wabaId?: string;

  @ValidateIf((o) => o.providerType !== "baileys")
  @IsString()
  @MinLength(1)
  accessToken?: string;

  @IsOptional()
  @IsString()
  verifyToken?: string;

  @IsOptional()
  @IsString()
  webhookSecret?: string;
}
