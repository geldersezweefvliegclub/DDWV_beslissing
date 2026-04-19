import { Injectable } from '@nestjs/common';
import { APIService } from './api.service';

export interface LidRecord {
  ID?: number;
  VOORNAAM?: string;
  NAAM?: string;
  EMAIL?: string;
  LIDTYPE_ID?: number;
}

@Injectable()
export class LedenService {
  constructor(private readonly apiService: APIService) {}

  async getLidById(id: number): Promise<LidRecord> {
    return this.apiService.get<LidRecord>('Leden/GetObject', {
      ID: id
    });
  }
}
