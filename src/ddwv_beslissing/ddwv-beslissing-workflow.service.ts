import {Injectable, Logger} from '@nestjs/common';
import {createHash} from 'node:crypto';
import {GoogleService} from '../google/google.service';
import {AanwezigLedenService, AanwezigLidRecord} from '../helios/services/aanwezig-leden.service';
import {DdwvService, UitkomstBeslissing} from '../helios/services/ddwv.service';
import {DienstenService} from '../helios/services/diensten.service';
import {LedenService} from '../helios/services/leden.service';
import {LoginService} from '../helios/services/login.service';
import {RoosterService} from '../helios/services/rooster.service';
import {toDutchDisplay, tomorrow, toYmd} from '../common/date.util';
import {DdwvMailBuilder} from './ddwv-mail.builder';
import {HeliosDienstenTypes, HeliosLidTypes} from "../helios/helios.types";

@Injectable()
export class DdwvBeslissingWorkflowService {
  private readonly logger = new Logger(DdwvBeslissingWorkflowService.name);

  constructor(
    private readonly loginService: LoginService,
    private readonly roosterService: RoosterService,
    private readonly aanwezigLedenService: AanwezigLedenService,
    private readonly dienstenService: DienstenService,
    private readonly ledenService: LedenService,
    private readonly ddwvService: DdwvService,
    private readonly googleService: GoogleService,
    private readonly mailBuilder: DdwvMailBuilder
  ) {}

  async run(baseDate = new Date()): Promise<void> {
    const targetDate = tomorrow(baseDate);
    const datum = toYmd(targetDate);
    const datumString = toDutchDisplay(targetDate);

    this.logger.log(`Start DDWV beslissing workflow, datum ${datum}`);
    await this.loginService.login();

    const rooster = await this.roosterService.getRooster(datum);

    if (rooster.DDWV === false) {
      this.logger.log(`Geen DDWV dag voor ${datum}; workflow stopt.`);
      return;
    }

    const hash = createHash('sha1').update(JSON.stringify(rooster), 'utf8').digest('hex');
    const beslissing = await this.ddwvService.Beslissing(datum, hash ); // beslissing wordt server side gedaan
    this.logger.log(`Uitkomst voor ${datum}: ${UitkomstBeslissing[beslissing]}`);

    const aanmeldingen = await this.aanwezigLedenService.getAanmeldingen(datum, datum);

    await this.emailVliegers(beslissing, aanmeldingen, datumString);
    await this.emailCrew(beslissing, datum, datumString);
  }

  private async emailVliegers(
    uitkomst: UitkomstBeslissing,
    aanmeldingen: AanwezigLidRecord[],
    datumString: string
  ): Promise<void> {
    for (const lid of aanmeldingen) {
      const email = lid.EMAIL?.trim();
      if (!email) {
        continue;
      }

      // Bij een clubbedrijf hebben alleen DDWV'ers een email nodig
      if (uitkomst === UitkomstBeslissing.CLUB && Number(lid.LIDTYPE as any) !== HeliosLidTypes.DDWV_VLIEGER) {
        continue;
      }

      const html = this.mailBuilder.buildVliegerMail(uitkomst, lid.VOORNAAM ?? lid.NAAM ?? 'lid', datumString);
      await this.googleService.sendHtmlEmail({
        to: email,
        subject: `DDWV Vliegdag ${datumString}`,
        html
      });
      this.logger.log(`Vlieger mail verstuurd naar ${email}`);
    }
  }

  private async emailCrew(uitkomst: UitkomstBeslissing, datum: string, datumString: string): Promise<void> {


    if (uitkomst === UitkomstBeslissing.CLUB) {
      this.logger.log('Clubdag: geen crew mail nodig.');
      return;
    }

    const diensten = await this.dienstenService.getDiensten(datum);
    if (diensten.length === 0) {
      this.logger.log('Geen diensten aanwezig.');
      return;
    }

    const bericht = this.getCrewBericht(uitkomst);
    for (const dienst of diensten) {
      if (!dienst.LID_ID) {
        continue;
      }

      const lid = await this.ledenService.getLidById(dienst.LID_ID);
      const email = lid.EMAIL?.trim();
      if (!email) {
        continue;
      }

      const html = this.mailBuilder.buildCrewMail(lid.VOORNAAM ?? lid.NAAM ?? '', datumString, bericht);
      await this.googleService.sendHtmlEmail({
        to: email,
        subject: `Je dienst voor ${datumString}`,
        html
      });

      const typeDienst = (dienst.TYPE_DIENST_ID == HeliosDienstenTypes.OCHTEND_STARTLEIDER ? 'Veldleider' : dienst.TYPE_DIENST) || ''
      this.logger.log(`Crew mail verstuurd naar ${email} (${typeDienst})'})`);
    }
  }

  private getCrewBericht(typeBedrijf: UitkomstBeslissing): string {
    switch (typeBedrijf) {
      case UitkomstBeslissing.LIEREN: return 'Op basis van het aantal aanmeldingen gaan we een <b>lierbedrijf</b> opzetten.';
      case UitkomstBeslissing.SLEPEN: return 'Op basis van het aantal aanmeldingen beperken we de DDWV dag tot een <b>sleepbedrijf</b>.';
      case UitkomstBeslissing.ANNULEREN: return 'Helaas zijn er onvoldoende aanmeldingen en zijn we genoodzaakt de DDWV dag te <b>annuleren</b>.';
      case UitkomstBeslissing.CLUB:
      default:
        return '';
    }
  }
}
