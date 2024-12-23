import {Injectable, InternalServerErrorException, Logger} from '@nestjs/common';
import {Alert} from "./alert.entity";
import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";
import {SetAlertDto} from "./setAlert.dto";


@Injectable()
export class AlertsService {
  constructor(

      private logger : Logger,
      @InjectRepository(Alert)
      public alertRepository: Repository<Alert>,

  ) {}
  async setAlert(setAlertDto: SetAlertDto): Promise<Alert> {
    const {chain, dollar, email} = setAlertDto;
    try {
      const alert = this.alertRepository.create({ chain, dollar, email });
      const savedAlert = await this.alertRepository.save(alert);
      this.logger.log('Set alert', `Chain: ${chain}, Dollar: ${dollar}, Email: ${email}`);
      return savedAlert;
    } catch (error) {
      this.logger.error('Error setting alert', `Chain: ${chain}, Dollar: ${dollar}, Email: ${email}, Error: ${error.message}`);
      throw new InternalServerErrorException(
          `Failed to set alert for chain: ${chain}, Email: ${email}`
      );
    }
  }
}
