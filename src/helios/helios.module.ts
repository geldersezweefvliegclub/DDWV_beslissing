import { Module } from '@nestjs/common';
import { APIService } from './services/api.service';
import { LoginService } from './services/login.service';
import { RoosterService } from './services/rooster.service';
import { AanwezigLedenService } from './services/aanwezig-leden.service';
import { DienstenService } from './services/diensten.service';
import { LedenService } from './services/leden.service';
import { DdwvService } from './services/ddwv.service';
import { GoogleModule } from '../google/google.module';

@Module({
  imports: [GoogleModule],
  providers: [APIService, LoginService, RoosterService, AanwezigLedenService, DienstenService, LedenService, DdwvService],
  exports: [APIService, LoginService, RoosterService, AanwezigLedenService, DienstenService, LedenService, DdwvService]
})
export class HeliosModule {}
