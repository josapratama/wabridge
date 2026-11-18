import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  MinLength,
} from "class-validator";

export class SendMessageDto {
  @IsString()
  @IsUUID()
  sessionId!: string;

  @IsString()
  @MinLength(1)
  to!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(4096)
  message!: string;

  @IsOptional()
  @IsIn(["text", "image", "document", "audio", "video", "location"])
  type?: string;

  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1024)
  mediaCaption?: string;

  @IsOptional()
  @IsString()
  mediaMimeType?: string;

  // Location
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  locationName?: string;

  @IsOptional()
  @IsString()
  quotedMessageId?: string;
}
