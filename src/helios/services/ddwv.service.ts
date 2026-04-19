import { Injectable } from '@nestjs/common';
import { APIService } from './api.service';

export enum UitkomstBeslissing {
  CLUB,
  LIEREN,
  SLEPEN,
  ANNULEREN
}

@Injectable()
export class DdwvService
{
  constructor(private readonly apiService: APIService)
  {
  }

  async Beslissing(datum: string, hash: string): Promise<UitkomstBeslissing>
  {
    const response: string = await this.apiService.get('DDWV/ToetsingDDWV', {
      DATUM: datum,
      HASH: hash
    });

    const uppercaseValue = response.toUpperCase();
    return UitkomstBeslissing[uppercaseValue as keyof typeof UitkomstBeslissing];
  }
}
