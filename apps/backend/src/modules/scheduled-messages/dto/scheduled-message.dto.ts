import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class CreateScheduledMessageDto {
  @IsString()
  @IsNotEmpty()
  sessionId!: string;

  @IsString()
  @IsNotEmpty()
  to!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(4096)
  content!: string;

  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @IsDateString()
  scheduledAt!: string;
}
