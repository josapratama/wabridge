import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateApiKeyDto {
  @IsString()
  @MinLength(3)
  @MaxLength(64)
  name!: string;

  @IsOptional()
  @IsString()
  expiresAt?: string; // ISO date string, optional
}
