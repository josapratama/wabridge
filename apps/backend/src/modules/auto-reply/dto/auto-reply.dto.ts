import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

export class CreateAutoReplyDto {
  @IsString()
  @MinLength(3)
  @MaxLength(64)
  name!: string;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsIn(["contains", "exact", "starts_with", "regex"])
  matchType!: "contains" | "exact" | "starts_with" | "regex";

  @IsString()
  @IsNotEmpty()
  matchValue!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(4096)
  replyContent!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;
}

export class UpdateAutoReplyDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(64)
  name?: string;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsIn(["contains", "exact", "starts_with", "regex"])
  matchType?: "contains" | "exact" | "starts_with" | "regex";

  @IsOptional()
  @IsString()
  matchValue?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4096)
  replyContent?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;
}
