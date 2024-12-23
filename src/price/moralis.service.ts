import {Injectable, Logger} from "@nestjs/common";
import Moralis from "moralis";
import {SupportedChains} from "../alerts/alert.entity";

@Injectable()
export class MoralisService {
    constructor(
        private logger: Logger,
    ) {
        this.initializeMoralis()
    }

    async fetchTokenPrice(address: string): Promise<number> {
        try {
            const options = {address, chain: '0x1'};
            const response = await Moralis.EvmApi.token.getTokenPrice(options);
            const data = response.toJSON();
            this.logger.log('Fetched token price', `Address: ${address}, Price: ${data.usdPrice}`);
            return data.usdPrice || 0;
        } catch (error) {
            this.logger.error('Error fetching token price', `Address: ${address}, Error: ${error.message}`);
            throw new Error(`Failed to fetch token price for address: ${address}`);
        }
    };

    private initializeMoralis() {
        try {
            Moralis.start({
                apiKey: process.env.MORALIS_API_KEY,
            });
            this.logger.log('Moralis initialized successfully', 'Initialization');
        } catch (error) {
            this.logger.error('Error initializing Moralis', error.message);
            throw new Error('Failed to initialize Moralis');
        }
    };

    async fetchLastDayPrices(chainName: string, address: string): Promise<{
        timestamp: Date;
        price: number;
        chain: SupportedChains;
    }[]> {
        const chainId = SupportedChains.Ethereum;
        const now = new Date();
        const prices: { timestamp: Date; price: number; chain: SupportedChains }[] = [];

        for (let i = 0; i < 24; i++) {
            const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);

            try {
                // Fetch the block closest to the timestamp
                const blockData = await Moralis.EvmApi.block.getDateToBlock({
                    date: timestamp.toISOString(),
                    chain: chainId,
                });

                const blockNumber = blockData.toJSON()?.block;
                if (!blockNumber) continue;

                // Fetch the token price at the specified block
                const priceData = await Moralis.EvmApi.token.getTokenPrice({
                    address,
                    chain: chainId,
                    toBlock: blockNumber,
                });

                const price = priceData.toJSON()?.usdPrice;

                if (price) {
                    prices.push({timestamp, price, chain: chainId});
                }
                this.logger.debug(`Synced data of hour ${24 - i } of last day for chain ${chainName}`)

            } catch (error) {
                this.logger.error(`Error fetching price for timestamp ${timestamp.toISOString()}:`, error.message);
                // Continue to the next interval even if one call fails
            }
        }

        return prices.reverse(); // Reverse to return prices in chronological order
    }


}