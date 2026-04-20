import * as fs from 'node:fs';

export function  escapeHtml(value?: string): string {
  return (value ?? '')
     .replace(/&/g, '&amp;')
     .replace(/</g, '&lt;')
     .replace(/>/g, '&gt;')
     .replace(/"/g, '&quot;')
     .replace(/'/g, '&#39;');
}

export function  nl2br(value?: string): string {
  return escapeHtml(value).replace(/\r?\n/g, '<br />');
}

export function loadTemplate(name: string): string {
  const path = process.env.TEMPLATE_PATH || "."

  let html = fs.readFileSync(`${path}/${name}`, 'utf8');
  const base64img = fs.readFileSync(`${path}/gezc-logo.png`, {encoding: 'base64'});

  return html.replaceAll(/\{base64img}/g, base64img);
}

export function renderTemplate(template: string, variables: Record<string, string>): string {
  return Object.entries(variables).reduce(
     (html, [key, value]) =>
        html.replace(new RegExp(`{\\s*${key}\\s*}`, 'g'), value),
     template
  );
}
