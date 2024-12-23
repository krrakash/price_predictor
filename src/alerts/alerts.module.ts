import {Logger, Module} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {Alert} from "./alert.entity";

import {AlertsController} from "./alerts.controller";
import {AlertsService} from "./alerts.service";
import {PriceService} from "../price/price.service";

@Module({
  imports: [TypeOrmModule.forFeature([ Alert])],
  providers: [Logger, AlertsService],
  controllers: [AlertsController],
  exports: [AlertsService]
})
export class AlertsModule {}
