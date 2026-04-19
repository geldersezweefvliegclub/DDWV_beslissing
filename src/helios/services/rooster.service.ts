import { Injectable } from '@nestjs/common';
import {APIService, HeliosDatasetResponse} from './api.service';

export interface RoosterRecord {
  ID?: number;
  DDWV?: boolean;
}

@Injectable()
export class RoosterService {
  constructor(private readonly apiService: APIService) {}

  /*
  async getRoosterRaw(datum: string): Promise<string> {
    return this.apiService.getText('Rooster/GetObject', {
      DATUM: datum,
    });
  }

  async getRooster(datum: string): Promise<RoosterRecord> {
    const body = await this.getRoosterRaw(datum);
    return JSON.parse(body) as RoosterRecord;
  }

   */

  async getRooster(datum: string): Promise<RoosterRecord> {
    const response = await this.apiService.get<HeliosDatasetResponse<RoosterRecord>>('Rooster/GetObject', {
      DATUM: datum,
    });
    return response as RoosterRecord;
  }
}
