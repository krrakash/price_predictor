import {Injectable, InternalServerErrorException, Logger} from '@nestjs/common';
import {Cron} from "@nestjs/schedule";
import {PriceService} from "./price/price.service";
import {MailerService} from "@nestjs-modules/mailer";
import * as process from "node:process";
import {AlertsService} from "./alerts/alerts.service";
import {SupportedChains} from "./alerts/alert.entity";


@Injectable()
export class AppService {
    constructor(
        private logger: Logger,
        private readonly priceService: PriceService,
        private readonly mailService: MailerService,
        private readonly alertsService: AlertsService,
    ) {
    }

    @Cron('*/5 * * * *')
    async syncPricesForEthereum() {
      await this.syncChainPrice(SupportedChains.Ethereum, "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2");
    }

    @Cron('*/5 * * * *')
    async syncPricesForPolygon() {
      await this.syncChainPrice(SupportedChains.Polygon, "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0");
    }

    private async syncChainPrice(chain: SupportedChains, contractAddress: string) {
        await this.priceService.syncPrices(chain, contractAddress);
        const priceChanges = await this.priceService.getPriceChanges(chain);
        await this.checkPriceIncreaseAndSendMail(priceChanges);
        await this.checkPriceAndSendAlerts(priceChanges);
    }

    private async checkPriceAndSendAlerts(priceChanges): Promise<void> {
        const currentPrice = priceChanges.latestPrice;
        const chain = priceChanges.chain;
        try {
            const alerts = await this.alertsService.alertRepository.find({
                where: {
                    chain
                }
            });

            for (const alert of alerts) {
                if (currentPrice < alert.dollar) {
                    this.logger.log('Alert not triggered', `Chain: ${alert.chain}, Current Price: ${currentPrice}, Alert Price: ${alert.dollar}`);
                    continue;
                }

                await this.sendEmail(
                    alert.email,
                    `Price Alert for ${alert.chain}`,
                    `The price of ${alert.chain} has reached or exceeded ${alert.dollar} USD. Current price: ${currentPrice} USD.`
                );
            }
        } catch (error) {
            this.logger.log('Error checking alerts', error.message);
            throw new InternalServerErrorException(
                `Failed to check alerts: ${error.message}`
            );
        }
    }


    private async checkPriceIncreaseAndSendMail(priceChanges) {
        if (priceChanges.percentageChange > 0.03) {
            this.logger.log('Price increased by more than 3%', `Chain: ${priceChanges.chain}, Latest Price: ${priceChanges.latestPrice}, One Hour Old Price: ${priceChanges.oneHourOldPrice}, Percentage Change: ${(priceChanges.percentageChange * 100).toFixed(2)}%`);
            await this.sendEmail(process.env.EMAIL_TO_ADDRESS, `Price Alert: Significant Increase for ${priceChanges.chain}`, `The price of ${priceChanges.chain} has increased by more than 3% in the last hour. Current price: ${priceChanges.latestPrice}`);
        } else {
            this.logger.log('Skipped mail, Price increase less than 3%', `Chain: ${priceChanges.chain}, Latest Price: ${priceChanges.latestPrice}, One Hour Old Price: ${priceChanges.oneHourOldPrice}, Percentage Change: ${(priceChanges.percentageChange * 100).toFixed(2)}%`);
        }
    }

    private async sendEmail(to: string, subject: string, text: string): Promise<void> {
        const mailOptions = {
            from: process.env.EMAIL_USERNAME,
            to,
            subject,
            text,
        };
        try {
            await this.mailService.sendMail(mailOptions);
            this.logger.log('Email sent successfully', `To: ${to}, Subject: ${subject}`);
        } catch (error) {
            this.logger.error('Error sending email', `To: ${to}, Subject: ${subject}, Error: ${error.message}`);
            throw new InternalServerErrorException(`Failed to send email to ${to}: ${error.message}`);
        }
    }
}
