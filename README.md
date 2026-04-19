# DDWV_beslissing

NestJS background worker that mirrors the structure of the reference `helios2email` project and implements the logic from `ddwv.beslissing.php`.

## What it does

Every run it:

1. Logs into Helios.
2. Reads tomorrow's roster (`Rooster/GetObject`).
3. Stops immediately when tomorrow is not a DDWV day.
4. Reads all registrations for tomorrow (`AanwezigLeden/GetObjects`).
5. Calls `DDWV/ToetsingDDWV` with the roster body hash.
6. Emails all registered pilots with the correct decision:
   - `club`
   - `lieren`
   - `slepen`
   - `annuleren`
7. Emails crew for tomorrow's services, except on `club` days.

## Project structure

This project intentionally follows the same structure style as the uploaded reference zip:

- `.github/workflows/`
- `templates/`
- `src/google/`
- `src/helios/`
- `src/common/`
- `src/ddwv_beslissing/`

## Configuration

Create these files locally:

- `helios.account.json`
- Google credentials JSON file

Example Helios file:

```json
{
  "url": "https://your-helios-host/api/",
  "username": "your-user",
  "password": "your-password",
  "token": "optional-extra-token"
}
```

Required environment variables:

- `GOOGLE_CREDENTIALS_PATH`
- `GOOGLE_ADMIN_EMAIL`

Optional environment variables:

- `HELIOS_CREDENTIAL_FILE` (default: `helios.account.json`)
- `VERZENDEN_EMAIL` (`false` disables sending and logs instead)
- `CRON_DDWV_BESLISSING` (default: `0 18 * * *`)
- `CRON_TIMEZONE` (default: `Europe/Amsterdam`)
- `DDWV_ALWAYS_TO` comma-separated additional recipients
- `DDWV_CREW_ALWAYS_TO` comma-separated additional crew recipients
- `DDWV_CLUB_LIDTYPE_ID` (default: `625`)
- `DDWV_ERROR_EMAIL` recipient for API error mails

## Run locally

```bash
npm install
npm run start:dev
```

## Build

```bash
npm run build
npm start
```

## Docker

```bash
docker build -t ddwv_beslissing .
```

## GitHub Actions

The included workflow builds and pushes a Docker image.
Set these repository secrets:

- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`
- `DOCKER_IMAGE` (example: `yourorg/ddwv_beslissing`)
