import { plainToInstance } from "class-transformer";
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Min,
  validateSync,
} from "class-validator";

enum Environment {
  Development = "development",
  Production = "production",
  Test = "test",
}

enum LogLevel {
  Debug = "debug",
  Info = "info",
  Warn = "warn",
  Error = "error",
  Verbose = "verbose",
}

enum StorageMode {
  Memory = "memory",
  Drizzle = "drizzle",
  Postgres = "postgres",
  Database = "database",
}

class EnvironmentVariables {
  @IsInt()
  @Min(1)
  PORT: number = 3000;

  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @IsEnum(LogLevel)
  LOG_LEVEL: LogLevel = LogLevel.Info;

  @IsEnum(StorageMode)
  STORAGE_MODE: StorageMode = StorageMode.Memory;

  @IsInt()
  @Min(100)
  DEFAULT_PROVIDER_TIMEOUT_MS: number = 10000;

  @IsInt()
  @Min(0)
  RETRY_ATTEMPTS: number = 3;

  @IsInt()
  @Min(0)
  RETRY_DELAY_MS: number = 1000;

  @IsUrl({ require_tld: false })
  META_GRAPH_BASE_URL: string = "https://graph.facebook.com";

  @IsString()
  META_API_VERSION: string = "v19.0";

  @IsOptional()
  @IsString()
  META_ACCESS_TOKEN?: string;

  @IsOptional()
  @IsString()
  META_PHONE_NUMBER_ID?: string;

  @IsOptional()
  @IsString()
  META_VERIFY_TOKEN?: string;

  @IsOptional()
  @IsString()
  META_APP_SECRET?: string;

  @IsOptional()
  @IsString()
  BSP_BASE_URL?: string;

  @IsOptional()
  @IsString()
  BSP_ACCESS_TOKEN?: string;

  @IsOptional()
  @IsString()
  BSP_VERIFY_TOKEN?: string;

  @IsOptional()
  @IsString()
  BSP_WEBHOOK_SECRET?: string;
}

export function validateConfig(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validated, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(`Config validation failed:\n${errors.toString()}`);
  }

  return validated;
}
