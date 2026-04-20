import { renderTemplate, loadTemplate, escapeHtml } from './html.util';

export function buildErrorMail(titel: string, inhoud: string): string {
  return renderTemplate(loadTemplate('error-email.html'), { TITEL: escapeHtml(titel), INHOUD: escapeHtml(inhoud) });
}
