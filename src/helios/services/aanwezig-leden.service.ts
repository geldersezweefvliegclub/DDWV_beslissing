import { Injectable } from '@nestjs/common';
import {APIService, HeliosDatasetResponse} from './api.service';

export interface AanwezigLidRecord {
  VOORNAAM?: string;
  NAAM?: string;
  EMAIL?: string;
  LIDTYPE_ID?: number;
  LIDTYPE?: number | string;
}

@Injectable()
export class AanwezigLedenService {
  constructor(private readonly apiService: APIService) {}

  async getAanmeldingen(beginDatum: string, eindDatum: string): Promise<AanwezigLidRecord[]> {
    const response = await this.apiService.get<HeliosDatasetResponse<AanwezigLidRecord>>('AanwezigLeden/GetObjects', {
      BEGIN_DATUM: beginDatum,
      EIND_DATUM: eindDatum
    });
    return response.dataset ?? [];
  }
}
