import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { APIService } from './api.service';

export interface DaginfoRecord {
  ID?: number;
  DATUM?: string;
  STARTMETHODE_ID?: number;
  CLUB_BEDRIJF?: boolean;
  VELD_ID?: number;
  DDWV?: boolean;
}

@Injectable()
export class DaginfoService {
  constructor(private readonly apiService: APIService) {}

  async getDaginfo(datum: string): Promise<DaginfoRecord | null> {
    try {
      return await this.apiService.get<DaginfoRecord>('Daginfo/GetObject', { DATUM: datum });
    } catch (error) {
      if (error instanceof HttpException && error.getStatus() === HttpStatus.NOT_FOUND) {
        return null;
      }
      throw error;
    }
  }

  async addDaginfo(daginfo: DaginfoRecord): Promise<DaginfoRecord> {
    return this.apiService.post<DaginfoRecord>('Daginfo/SaveObject', daginfo);
  }

  async updateDaginfo(daginfo: DaginfoRecord): Promise<DaginfoRecord> {
    return this.apiService.put<DaginfoRecord>('Daginfo/SaveObject', daginfo);
  }
}