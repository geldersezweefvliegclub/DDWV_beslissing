import { Injectable } from '@nestjs/common';
import { loadTemplate, renderTemplate } from '../common/html.util';
import { DdwvBedrijfType } from '../helios/helios.types';

@Injectable()
export class DdwvMailBuilder {
  buildPilotMail(type: DdwvBedrijfType, voornaam: string, datumString: string): string {
    const file = {
      club: 'ddwv-club.html',
      lieren: 'ddwv-lieren.html',
      slepen: 'ddwv-slepen.html',
      annuleren: 'ddwv-annuleren.html'
    }[type];

    return renderTemplate(loadTemplate(file), {
      voornaam,
      datumString
    });
  }

  buildCrewMail(voornaam: string, datumString: string, bericht: string): string {
    return renderTemplate(loadTemplate('ddwv-crew.html'), {
      voornaam,
      datumString,
      bericht
    });
  }
}
