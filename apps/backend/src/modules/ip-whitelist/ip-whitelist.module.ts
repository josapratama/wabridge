import { Module } from "@nestjs/common";
import { IpWhitelistService } from "./ip-whitelist.service";
import { IpWhitelistController } from "./ip-whitelist.controller";
import { RepositoriesModule } from "../../repositories/repositories.module";

@Module({
  imports: [RepositoriesModule],
  providers: [IpWhitelistService],
  controllers: [IpWhitelistController],
  exports: [IpWhitelistService],
})
export class IpWhitelistModule {}
