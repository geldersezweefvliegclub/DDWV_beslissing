import { Injectable } from '@nestjs/common';
import { Base64 } from 'js-base64';
import { createHash } from 'node:crypto';
import * as fs from 'node:fs';
import { APIService, HELIOS_CREDENTIAL_FILE } from './api.service';

interface HeliosConfig {
  url: string;
  username: string;
  password: string;
  token?: string;
}

interface BearerToken {
  TOKEN: string;
}

@Injectable()
export class LoginService {
  constructor(private readonly apiService: APIService) {}

  async login(): Promise<boolean> {
    const file = process.env.HELIOS_CREDENTIAL_FILE || HELIOS_CREDENTIAL_FILE;
    const config = fs.existsSync(file)
      ? (JSON.parse(fs.readFileSync(file, { encoding: 'utf8' })) as HeliosConfig)
      : undefined;

    if (!config) {
      throw new Error('Helios credentials file not found');
    }

    const headers = new Headers({
      Authorization: `Basic ${Base64.encode(`${config.username}:${config.password}`)}`
    });

    const params: Record<string, string> = {};
    if (config.token) {
      params.token = createHash('sha1').update(config.token + config.password, 'utf8').digest('hex');
    }

    const login = await this.apiService.get<BearerToken>('Login/Login', params, headers);
    await this.apiService.setBearerToken(login.TOKEN);
    return true;
  }
}
