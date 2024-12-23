import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import {SupportedChains} from "../../alerts/alert.entity";

export class GetPriceDto {
    @ApiProperty({
        description: 'Chain identifier (Ethereum: 0x1, Polygon: 0x89)',
        enum: SupportedChains,
        enumName: 'SupportedChains',
        example: SupportedChains.Ethereum,
    })
    @IsEnum(SupportedChains, { message: 'Invalid chain. Allowed values are 0x1 (Ethereum) or 0x89 (Polygon).' })
    chain: SupportedChains;
}
