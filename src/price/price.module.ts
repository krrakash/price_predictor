import {Logger, Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {PriceService} from './price.service';
import {PriceController} from './price.controller';
import {Price} from './price.entity';
import {HttpModule} from '@nestjs/axios';
import {MoralisService} from "./moralis.service";

@Module({
    imports: [TypeOrmModule.forFeature([Price]), HttpModule],
    providers: [PriceService, MoralisService, Logger],
    controllers: [PriceController],
    exports: [PriceService]
})
export class PriceModule {
}
