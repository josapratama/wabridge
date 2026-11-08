import { Module } from "@nestjs/common";
import { ContactsService } from "./contacts.service";
import { ContactsController } from "./contacts.controller";
import { RepositoriesModule } from "../../repositories/repositories.module";
import { ProvidersModule } from "../providers/providers.module";

@Module({
  imports: [RepositoriesModule, ProvidersModule],
  providers: [ContactsService],
  controllers: [ContactsController],
  exports: [ContactsService],
})
export class ContactsModule {}
