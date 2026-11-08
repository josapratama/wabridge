import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

export class V1SendMessageDto {
  @IsString() @IsNotEmpty() session_id!: string;
  @IsString() @IsNotEmpty() @MinLength(7) @MaxLength(20) to!: string;
  @IsString() @IsNotEmpty() @MaxLength(4096) message!: string;

  @IsOptional()
  @IsIn(["text", "image", "document", "audio", "video", "location"])
  type?: string;

  @IsOptional() @IsString() media_url?: string;
  @IsOptional() @IsString() @MaxLength(1024) caption?: string;
  @IsOptional() @IsString() media_mime_type?: string;
  @IsOptional() @IsNumber() latitude?: number;
  @IsOptional() @IsNumber() longitude?: number;
  @IsOptional() @IsString() location_name?: string;

  @IsOptional() @IsBoolean() sandbox?: boolean; // if true, don't actually send
}

export class V1BroadcastDto {
  @IsString() @IsNotEmpty() session_id!: string;
  @IsString({ each: true }) recipients!: string[];
  @IsString() @IsNotEmpty() @MaxLength(4096) message!: string;
  @IsOptional() delay_ms?: number;
  @IsOptional() @IsBoolean() sandbox?: boolean;
}
