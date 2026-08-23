import {Injectable, Logger} from '@nestjs/common';
import { loadTemplate, renderTemplate } from '../common/html.util';
import {UitkomstBeslissing} from "./uitkomst-beslissing";

@Injectable()
export class DdwvMailBuilder {
  private readonly logger = new Logger(DdwvMailBuilder.name);

  buildVliegerMail(type: UitkomstBeslissing, voornaam: string, datumString: string): string {
    const file = {
      CLUB: 'ddwv-club.html',
      LIEREN: 'ddwv-lieren.html',
      SLEPEN: 'ddwv-slepen.html',
      ANNULEREN: 'ddwv-annuleren.html'
    }[UitkomstBeslissing[type]];

    if (!file) {
      this.logger.error(`Onbekend type bedrijf ${type.toString()}, geen mail template beschikbaar`);
      return '';
    }
    return renderTemplate(loadTemplate(file), {
      VOORNAAM: voornaam,
      DATUM: datumString
    });
  }

  buildCrewMail(voornaam: string, datumString: string, bericht: string): string {
    return renderTemplate(loadTemplate('ddwv-crew.html'), {
      VOORNAAM: voornaam,
      DATUM: datumString,
      BERICHT: bericht
    });
  }
}
