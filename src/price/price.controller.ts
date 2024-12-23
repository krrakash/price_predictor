import { Controller, Get, Query} from '@nestjs/common';
import { PriceService } from './price.service';
import {GetPriceDto} from "./dtos/getPrice.dto";

@Controller('price')
export class PriceController {
    constructor(private readonly priceService: PriceService) {}

    @Get('hourly')
    async getHourlyPrices(@Query() getPriceDto: GetPriceDto) {
        return this.priceService.getHourlyPrices(getPriceDto.chain);
    }


    @Get('swap-rate')
    async getSwapRate(@Query('ethAmount') ethAmount: number) {
        return this.priceService.calculateSwapRate(ethAmount);
    }

}
