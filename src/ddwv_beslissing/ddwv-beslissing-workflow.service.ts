import {Injectable, Logger} from '@nestjs/common';
import {GoogleService} from '../google/google.service';
import {AanwezigLedenService, AanwezigLidRecord} from '../helios/services/aanwezig-leden.service';
import {DaginfoService} from '../helios/services/daginfo.service';
import {DienstenService} from '../helios/services/diensten.service';
import {LedenService} from '../helios/services/leden.service';
import {LoginService} from '../helios/services/login.service';
import {RoosterRecord, RoosterService} from '../helios/services/rooster.service';
import {toDutchDisplay, tomorrow, toYmd} from '../common/date.util';
import {DdwvMailBuilder} from './ddwv-mail.builder';
import {UitkomstBeslissing} from './uitkomst-beslissing';
import {HeliosDienstenTypes, HeliosLidTypes} from "../helios/helios.types";

const VELD_ID_TERLET = 901;
const STARTMETHODE_SLEPEN = 501;
const STARTMETHODE_LIEREN = 550; // ook voor club bedrijf

@Injectable()
export class DdwvBeslissingWorkflowService {
  private readonly logger = new Logger(DdwvBeslissingWorkflowService.name);

  constructor(
    private readonly loginService: LoginService,
    private readonly roosterService: RoosterService,
    private readonly aanwezigLedenService: AanwezigLedenService,
    private readonly dienstenService: DienstenService,
    private readonly ledenService: LedenService,
    private readonly daginfoService: DaginfoService,
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

    const beslissing = await this.bepaalTypeBedrijf(datum, rooster);
    this.logger.log(`Uitkomst voor ${datum}: ${UitkomstBeslissing[beslissing]}`);

    const aanmeldingen = await this.aanwezigLedenService.getAanmeldingen(datum, datum);
    const terletAanmeldingen = aanmeldingen.filter(a => a.VELD_ID === VELD_ID_TERLET);

    await this.emailVliegers(beslissing, terletAanmeldingen, datumString);
    await this.emailCrew(beslissing, datum, datumString);
  }

  /*
   Toetsen of de DDWV dag doorgaat: club, lieren, slepen of annuleren.
  */
  private async bepaalTypeBedrijf(datum: string, rooster: RoosterRecord): Promise<UitkomstBeslissing> {
    const aanmeldingen = await this.aanwezigLedenService.getAanmeldingenVoorVeld(datum, datum, VELD_ID_TERLET);
    const totaal = aanmeldingen.totaal ?? 0;

    this.logger.log(`Aantal aanmeldingen voor ${datum}: ${totaal} (Clubbedrijf: ${rooster.CLUB_BEDRIJF}, MinSleepStart: ${rooster.MIN_SLEEPSTART}, MinLierStart: ${rooster.MIN_LIERSTART})`);

    let typeBedrijf = UitkomstBeslissing.ANNULEREN;
    if (totaal >= (rooster.MIN_SLEEPSTART ?? 0)) {
      typeBedrijf = UitkomstBeslissing.SLEPEN;
    }
    if (totaal >= (rooster.MIN_LIERSTART ?? 0)) {
      typeBedrijf = UitkomstBeslissing.LIEREN;
    }
    if (rooster.CLUB_BEDRIJF === true) {
      typeBedrijf = UitkomstBeslissing.CLUB;
    }

    if (typeBedrijf === UitkomstBeslissing.ANNULEREN) {
      await this.roosterService.updateRooster({ ID: rooster.ID, DDWV: false });
    } else {
      await this.zetDaginfo(datum, typeBedrijf);
    }

    return typeBedrijf;
  }


  private async zetDaginfo(datum: string, typeBedrijf: UitkomstBeslissing): Promise<void> {
    const startmethodeId = typeBedrijf === UitkomstBeslissing.SLEPEN ? STARTMETHODE_SLEPEN : STARTMETHODE_LIEREN;
    const clubBedrijf = typeBedrijf === UitkomstBeslissing.CLUB;

    const daginfo = await this.daginfoService.getDaginfo(datum);

    if (daginfo) {
      await this.daginfoService.updateDaginfo({
        ID: daginfo.ID,
        STARTMETHODE_ID: startmethodeId,
        CLUB_BEDRIJF: clubBedrijf,
        VELD_ID: VELD_ID_TERLET,
        DDWV: true
      });
    } else {
      await this.daginfoService.addDaginfo({
        STARTMETHODE_ID: startmethodeId,
        CLUB_BEDRIJF: clubBedrijf,
        DATUM: datum,
        VELD_ID: VELD_ID_TERLET,
        DDWV: true
      });
    }
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
      this.logger.log(`Crew mail verstuurd naar ${email} (${typeDienst})`);
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
