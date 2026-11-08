import { IsObject, IsString, MaxLength, MinLength } from "class-validator";

export class CreateTemplateDto {
  @IsString()
  @MinLength(3)
  @MaxLength(64)
  name!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(4096)
  content!: string;
}

export class RenderTemplateDto {
  @IsObject()
  variables!: Record<string, string>;
}
