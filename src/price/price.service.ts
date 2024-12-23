import {Injectable, InternalServerErrorException, Logger} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {MoreThan, Repository} from 'typeorm';
import {Price} from './price.entity';
import {MoralisService} from "./moralis.service";
import {SupportedChains} from "../alerts/alert.entity";

@Injectable()
export class PriceService {
    constructor(
        @InjectRepository(Price)
        private priceRepository: Repository<Price>,
        private logger: Logger,
        private moralisService: MoralisService,
    ) {
        this.initDbWithLastDayPrices();
    }

    async syncPrices(chain: SupportedChains, address: string): Promise<void> {
        try {
            const ethPrice = await this.fetchPrice(address);
            this.logger.log('Fetched prices', `ETH Price: ${ethPrice}`)
            await this.savePrice(chain, ethPrice);
        } catch (error) {
            this.logger.error('Error fetching and saving prices', error.message);
            throw new InternalServerErrorException(`Failed to fetch and save prices: ${error.message}`)
        }
    }

    async getHourlyPrices(chain: SupportedChains): Promise<{
        startTime: Date;
        endTime: Date;
        maxPrice: number;
        minPrice: number;
        avgPrice: number;
        prices: number[];
    }[]> {
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
        try {
            const prices = await this.priceRepository.find({
                where: {chain, timestamp: MoreThan(since)},
                order: {timestamp: 'ASC'},
            });

            this.logger.log(`Fetched hourly prices`, `Chain: ${chain}, Prices Count: ${prices.length}`);

            const hourlyData: {
                startTime: Date;
                endTime: Date;
                maxPrice: number;
                minPrice: number;
                avgPrice: number;
                prices: any[];
            }[] = [];

            for (let i = 0; i < 24; i++) {
                const startTime = new Date(since.getTime() + i * 60 * 60 * 1000);
                const endTime = new Date(since.getTime() + (i + 1) * 60 * 60 * 1000);

                const hourlyPrices = prices
                    .filter((price) => price.timestamp >= startTime && price.timestamp < endTime)
                    .map((price) => price);

                const hourlyPriceValues = hourlyPrices.map(v => v.price)

                if (hourlyPrices.length > 0) {
                    const maxPrice = Math.max(...hourlyPriceValues);
                    const minPrice = Math.min(...hourlyPriceValues);
                    const avgPrice = hourlyPrices.reduce((sum, price) => sum + price.price, 0) / hourlyPrices.length;

                    hourlyData.push({
                        startTime,
                        endTime,
                        maxPrice,
                        minPrice,
                        avgPrice,
                        prices: hourlyPrices,
                    });
                }
            }

            return hourlyData;
        } catch (error) {
            this.logger.error(`Error fetching hourly prices`, `Chain: ${chain}, Error: ${error.message}`);
            throw new InternalServerErrorException(`Failed to fetch hourly prices for chain: ${chain}`);
        }
    }


    async calculateSwapRate(ethAmount: number): Promise<{ btc: number; feeEth: number; feeUsd: number }> {
        try {
            const ethPrice = await this.fetchPrice('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'); // ETH
            const btcPrice = await this.fetchPrice('0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599'); // WBTC

            const feeEth = ethAmount * 0.03; // 3% fee
            const feeUsd = feeEth * ethPrice; // Fee in USD
            const btc = ((ethAmount - feeEth) * ethPrice) / btcPrice; // BTC received after fee

            this.logger.log('Calculated swap rate', `ETH: ${ethAmount}, BTC: ${btc}, Fee (ETH): ${feeEth}, Fee (USD): ${feeUsd}`);

            return {btc, feeEth, feeUsd};
        } catch (error) {
            this.logger.error('Error calculating swap rate', `ETH: ${ethAmount}, Error: ${error.message}`);
            throw new InternalServerErrorException(
                `Failed to calculate swap rate: ${error.message}`
            );
        }
    }

    async getPriceChanges(chain: SupportedChains) {
        let changes = {
            latestPrice: 0,
            oneHourOldPrice: 0,
            percentageChange: 0,
            chain
        }
        try {
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            const recentPrices = await this.priceRepository.find({
                where: {timestamp: MoreThan(oneHourAgo), chain},
            });

            if (!recentPrices.length) {
                this.logger.log('No recent prices available', 'Skipping price increase notification');
                return;
            }

            changes.latestPrice = recentPrices[recentPrices.length - 1].price;
            changes.oneHourOldPrice = recentPrices[0]?.price

            if (changes.oneHourOldPrice) {
                changes.percentageChange = (changes.latestPrice - changes.oneHourOldPrice) / changes.oneHourOldPrice;
            } else {
                this.logger.log('Insufficient data for price comparison', 'One hour old price is missing');
            }
            return changes;
        } catch (error) {
            this.logger.error('Error checking price increase and notifying', error.message);
            throw new InternalServerErrorException(`Failed to check price increase: ${error.message}`);
        }
    }

    private async fetchPrice(address: string): Promise<number> {
        return this.moralisService.fetchTokenPrice(address);
    }

    private async savePrice(chain: SupportedChains, price: number): Promise<void> {
        try {
            const priceRecord = this.priceRepository.create({chain, price});
            await this.priceRepository.save(priceRecord);
            this.logger.log('Saved price', `Chain: ${chain}, Price: ${price}`);
        } catch (error) {
            this.logger.error('Error saving price', `Chain: ${chain}, Price: ${price}, Error: ${error.message}`);
            throw new InternalServerErrorException(`Failed to save price for chain: ${chain}`);
        }
    }

    private async initDbWithLastDayPrices() {
        await this.priceRepository.clear()
        const ethPrices = await this.moralisService.fetchLastDayPrices("Ethereum", '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2');
        await this.priceRepository.save(ethPrices);
        this.logger.log("DB initialized with last 24 hour prices for Eth");
        let  polygonPrices = await this.moralisService.fetchLastDayPrices('Polygon', '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0');
        polygonPrices.forEach(p => {
            p.chain = SupportedChains.Polygon
        })
        await this.priceRepository.save(polygonPrices);
        this.logger.log("DB initialized with last 24 hour prices for Polygon");
    }


}
