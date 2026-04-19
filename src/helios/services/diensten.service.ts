import { Injectable } from '@nestjs/common';
import {APIService, HeliosDatasetResponse} from './api.service';

export interface DienstRecord {
  TYPE_DIENST_ID?: number;
  TYPE_DIENST?: string;
  LID_ID?: number;
}


@Injectable()
export class DienstenService {
  constructor(private readonly apiService: APIService) {}

  async getDiensten(datum: string): Promise<DienstRecord[]> {
    const response = await this.apiService.get<HeliosDatasetResponse<DienstRecord>>('Diensten/GetObjects', {
      DATUM: datum
    });
    return response.dataset ?? [];
  }
}
