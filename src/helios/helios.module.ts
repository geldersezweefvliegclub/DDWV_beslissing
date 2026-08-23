import { Module } from '@nestjs/common';
import { APIService } from './services/api.service';
import { LoginService } from './services/login.service';
import { RoosterService } from './services/rooster.service';
import { AanwezigLedenService } from './services/aanwezig-leden.service';
import { DienstenService } from './services/diensten.service';
import { LedenService } from './services/leden.service';
import { DaginfoService } from './services/daginfo.service';
import { GoogleModule } from '../google/google.module';

@Module({
  imports: [GoogleModule],
  providers: [
    APIService,
    LoginService,
    RoosterService,
    AanwezigLedenService,
    DienstenService,
    LedenService,
    DaginfoService
  ],
  exports: [
    APIService,
    LoginService,
    RoosterService,
    AanwezigLedenService,
    DienstenService,
    LedenService,
    DaginfoService
  ]
})
export class HeliosModule {}
