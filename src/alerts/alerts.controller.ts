import {Body, Controller, Get, Post, ValidationPipe} from '@nestjs/common';
import { AlertsService } from './alerts.service';
import {SetAlertDto} from "./setAlert.dto";

@Controller()
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Post('alert')
  async setPriceAlert(@Body(ValidationPipe) setAlertDto: SetAlertDto) {
    const alert = await this.alertsService.setAlert(setAlertDto);
    return { message: 'Alert set successfully', alert };
  }
}
