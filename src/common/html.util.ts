import * as fs from 'node:fs';
import * as path from 'node:path';

export function loadTemplate(name: string): string {
  const templatePath = path.join(process.cwd(), 'templates', name);
  return fs.readFileSync(templatePath, 'utf8');
}

export function renderTemplate(template: string, variables: Record<string, string>): string {
  return Object.entries(variables).reduce(
    (html, [key, value]) => html.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), value),
    template
  );
}
