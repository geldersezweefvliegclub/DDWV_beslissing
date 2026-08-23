import { Injectable } from '@nestjs/common';
import {APIService, HeliosDatasetResponse} from './api.service';

export interface AanwezigLidRecord {
  VOORNAAM?: string;
  NAAM?: string;
  EMAIL?: string;
  VELD_ID?: number;
  LIDTYPE_ID?: number;
  LIDTYPE?: number | string;
}

@Injectable()
export class AanwezigLedenService {
  constructor(private readonly apiService: APIService) {}

  async getAanmeldingenVoorVeld(
    beginDatum: string,
    eindDatum: string,
    veldId: number
  ): Promise<HeliosDatasetResponse<AanwezigLidRecord>> {
    return this.apiService.get<HeliosDatasetResponse<AanwezigLidRecord>>('AanwezigLeden/GetObjects', {
      BEGIN_DATUM: beginDatum,
      EIND_DATUM: eindDatum,
      VLIEGVELD: veldId
    });
  }
}
