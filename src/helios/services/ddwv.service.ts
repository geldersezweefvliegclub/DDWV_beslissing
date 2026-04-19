import { Injectable } from '@nestjs/common';
import { APIService } from './api.service';
import { DdwvBedrijfType } from '../helios.types';

@Injectable()
export class DdwvService {
  constructor(private readonly apiService: APIService) {}

  async getTypeBedrijf(datum: string, hash: string): Promise<DdwvBedrijfType> {
    const response = await this.apiService.getText('DDWV/ToetsingDDWV', {
      DATUM: datum,
      HASH: hash
    });
    return JSON.parse(response) as DdwvBedrijfType;
  }
}
