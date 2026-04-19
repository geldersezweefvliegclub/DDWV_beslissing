import { renderTemplate } from './html.util';

const template = `
<html>
  <body style="font-family: Arial, Helvetica, sans-serif; font-size: 12px;">
    <p>Er is een fout opgetreden in DDWV_beslissing.</p>
    <p><b>Onderwerp:</b> {{subject}}</p>
    <pre>{{message}}</pre>
  </body>
</html>`;

export function buildErrorMail(subject: string, message: string): string {
  return renderTemplate(template, { subject, message });
}
