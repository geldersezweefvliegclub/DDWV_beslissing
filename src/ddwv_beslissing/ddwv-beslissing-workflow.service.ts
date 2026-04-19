import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { GoogleService } from '../google/google.service';
import { AanwezigLedenService } from '../helios/services/aanwezig-leden.service';
import { DdwvService } from '../helios/services/ddwv.service';
import { DienstenService } from '../helios/services/diensten.service';
import { LedenService } from '../helios/services/leden.service';
import { LoginService } from '../helios/services/login.service';
import { RoosterService } from '../helios/services/rooster.service';
import { AanwezigLidRecord, DdwvBedrijfType, LidRecord } from '../helios/helios.types';
import { toDutchDisplay, tomorrow, toYmd } from '../common/date.util';
import { DdwvMailBuilder } from './ddwv-mail.builder';

@Injectable()
export class DdwvBeslissingWorkflowService {
  private readonly logger = new Logger(DdwvBeslissingWorkflowService.name);

  constructor(
    private readonly loginService: LoginService,
    private readonly roosterService: RoosterService,
    private readonly aanwezigLedenService: AanwezigLedenService,
    private readonly ddwvService: DdwvService,
    private readonly dienstenService: DienstenService,
    private readonly ledenService: LedenService,
    private readonly googleService: GoogleService,
    private readonly mailBuilder: DdwvMailBuilder
  ) {}

  async run(baseDate = new Date()): Promise<void> {
    const targetDate = tomorrow(baseDate);
    const datum = toYmd(targetDate);
    const datumString = toDutchDisplay(targetDate);

    this.logger.log(`Start DDWV beslissing workflow, datum ${datum}`);
    await this.loginService.login();

    const roosterBody = await this.roosterService.getRoosterRaw(datum);
    const rooster = JSON.parse(roosterBody) as { DDWV?: boolean };

    if (rooster.DDWV === false) {
      this.logger.log(`Geen DDWV dag voor ${datum}; workflow stopt.`);
      return;
    }

    const hash = createHash('sha1').update(roosterBody, 'utf8').digest('hex');
    const leden = await this.aanwezigLedenService.getAanmeldingen(datum, datum);
    const typeBedrijf = await this.ddwvService.getTypeBedrijf(datum, hash);

    this.logger.log(`Type bedrijf voor ${datum}: ${typeBedrijf}`);

    await this.emailVliegers(typeBedrijf, leden, datumString);
    await this.emailCrew(typeBedrijf, datum, datumString);
  }

  private async emailVliegers(
    typeBedrijf: DdwvBedrijfType,
    leden: AanwezigLidRecord[],
    datumString: string
  ): Promise<void> {
    const clubLidtypeId = Number(process.env.DDWV_CLUB_LIDTYPE_ID ?? '625');
    const alwaysTo = this.parseRecipientList(process.env.DDWV_ALWAYS_TO);

    for (const lid of leden) {
      const email = lid.EMAIL?.trim();
      if (!email) {
        continue;
      }

      if (typeBedrijf === 'club' && Number(lid.LIDTYPE as any) !== clubLidtypeId && lid.LIDTYPE_ID !== clubLidtypeId) {
        continue;
      }

      const html = this.mailBuilder.buildPilotMail(typeBedrijf, lid.VOORNAAM ?? lid.NAAM ?? 'lid', datumString);
      await this.googleService.sendHtmlEmail({
        to: email,
        subject: `DDWV Vliegdag ${datumString}`,
        html
      });
      this.logger.log(`Pilot mail verstuurd naar ${email}`);
    }

    if (alwaysTo.length) {
      const html = this.mailBuilder.buildPilotMail(typeBedrijf, 'allen', datumString);
      await this.googleService.sendHtmlEmail({
        bcc: alwaysTo,
        subject: `DDWV Vliegdag ${datumString}`,
        html
      });
      this.logger.log(`Extra pilot ontvangers verwerkt: ${alwaysTo.join(', ')}`);
    }
  }

  private async emailCrew(typeBedrijf: DdwvBedrijfType, datum: string, datumString: string): Promise<void> {
    if (typeBedrijf === 'club') {
      this.logger.log('Clubdag: geen crew mails nodig.');
      return;
    }

    const diensten = await this.dienstenService.getDiensten(datum);
    if (diensten.length === 0) {
      this.logger.log('Geen diensten ingevoerd.');
      return;
    }

    const bericht = this.getCrewBericht(typeBedrijf);
    for (const dienst of diensten) {
      if (!dienst.LID_ID) {
        continue;
      }

      const lid = await this.ledenService.getLidById(dienst.LID_ID);
      const email = lid.EMAIL?.trim();
      if (!email) {
        continue;
      }

      const html = this.mailBuilder.buildCrewMail(lid.VOORNAAM ?? lid.NAAM ?? 'lid', datumString, bericht);
      await this.googleService.sendHtmlEmail({
        to: email,
        subject: `Je dienst voor ${datumString}`,
        html
      });
      this.logger.log(`Crew mail verstuurd naar ${email} (${dienst.TYPE_DIENST ?? 'onbekende dienst'})`);
    }

    const extraCrew = this.parseRecipientList(process.env.DDWV_CREW_ALWAYS_TO);
    if (extraCrew.length) {
      const html = this.mailBuilder.buildCrewMail('allen', datumString, bericht);
      await this.googleService.sendHtmlEmail({
        bcc: extraCrew,
        subject: `Je dienst voor ${datumString}`,
        html
      });
      this.logger.log(`Extra crew ontvangers verwerkt: ${extraCrew.join(', ')}`);
    }
  }

  private getCrewBericht(typeBedrijf: DdwvBedrijfType): string {
    switch (typeBedrijf) {
      case 'lieren':
        return 'Op basis van het aantal aanmeldingen gaan we een <b>lierbedrijf</b> opzetten.';
      case 'slepen':
        return 'Op basis van het aantal aanmeldingen beperken we de DDWV dag tot een <b>sleepbedrijf</b>.';
      case 'annuleren':
        return 'Helaas zijn er onvoldoende aanmeldingen en zijn we genoodzaakt de DDWV dag te <b>annuleren</b>.';
      case 'club':
      default:
        return '';
    }
  }

  private parseRecipientList(value?: string): string[] {
    return (value ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
}
