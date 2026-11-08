import { IsString, IsUUID, MinLength } from "class-validator";

export class CreateSessionDto {
  @IsString()
  @MinLength(3)
  name!: string;

  @IsString()
  @IsUUID()
  providerConfigId!: string;
}
