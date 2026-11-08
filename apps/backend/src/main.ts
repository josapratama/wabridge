import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";
import { AppLogger } from "./common/logger/app.logger";
import { join } from "path";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false }),
    { bufferLogs: true },
  );

  app.useStaticAssets({
    root: join(process.cwd(), "public"),
    prefix: "/",
  });

  app.setViewEngine({
    engine: {
      ejs: require("ejs"),
    },
    templates: join(__dirname, "..", "views"),
  });

  const logger = app.get(AppLogger);
  app.useLogger(logger);

  // Global validation pipe — strips unknown fields, transforms types
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Enable CORS for development
  app.enableCors();

  const port = parseInt(process.env.PORT ?? "3000", 10);
  await app.listen(port, "0.0.0.0");

  logger.log(
    `WhatsApp Integration API running on http://localhost:${port}`,
    "Bootstrap",
  );
  logger.log(
    `Environment: ${process.env.NODE_ENV ?? "development"}`,
    "Bootstrap",
  );
}

bootstrap().catch((err: unknown) => {
  console.error("Failed to start application:", err);
  process.exit(1);
});
