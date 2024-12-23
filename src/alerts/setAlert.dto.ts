import { ApiProperty } from '@nestjs/swagger';
import {IsEmail, IsEnum, IsNumber, IsString} from 'class-validator';
import {SupportedChains} from "./alert.entity";

export class SetAlertDto {
    @ApiProperty({
        description: 'Chain identifier (Ethereum: 0x1, Polygon: 0x89)',
        enum: SupportedChains,
        enumName: 'SupportedChains',
        example: SupportedChains.Ethereum,
    })
    @IsEnum(SupportedChains, { message: 'Invalid chain. Allowed values are 0x1 (Ethereum) or 0x89 (Polygon).' })
    chain: SupportedChains;

    @ApiProperty({
        description: 'The price in USD to trigger the alert',
        example: 1000,
    })
    @IsNumber()
    dollar: number;

    @ApiProperty({
        description: 'The email address to send the alert notification to',
        example: 'user@example.com',
    })
    @IsEmail()
    email: string;
}
