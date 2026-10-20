/**
 * Extracción del artículo original con @mozilla/readability.
 *
 * Reglas:
 *  - Se respeta robots.txt: si la ruta está prohibida para `User-agent: *`, no
 *    se descarga.
 *  - No se saltan paywalls: 401/402/403 o contenido no HTML ⇒ se sigue sin
 *    texto del artículo (el post se escribe con título + resumen del feed).
 *  - Nunca se guarda el HTML: sólo el texto plano para el prompt.
 */
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import type { ExtractedArticle } from './types.js';

const USER_AGENT = 'HighDoctorFoundationBot/1.0 (+https://highdoctor.foundation)';
const TIMEOUT_MS = 25_000;
const MAX_BYTES = 3_000_000;
const MAX_TEXT_CHARS = 12_000;

/** Reglas `Disallow` del grupo `User-agent: *` de robots.txt. */
export function parseRobots(robotsTxt: string): string[] {
  const disallow: string[] = [];
  let inWildcardGroup = false;

  for (const rawLine of robotsTxt.split(/\r?\n/)) {
    const line = rawLine.split('#')[0].trim();
    if (!line) continue;
    const [rawKey, ...rest] = line.split(':');
    const key = rawKey.trim().toLowerCase();
    const value = rest.join(':').trim();

    if (key === 'user-agent') {
      const agent = value.toLowerCase();
      inWildcardGroup = agent === '*';
      continue;
    }
    if (key === 'disallow' && inWildcardGroup && value !== '') {
      disallow.push(value);
    }
  }

  return disallow;
}

function pathMatchesRule(pathname: string, rule: string): boolean {
  if (rule === '') return false;
  const escaped = rule.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  try {
    return new RegExp(`^${escaped}`).test(pathname);
  } catch {
    return pathname.startsWith(rule);
  }
}

export function isAllowedByRobots(pathname: string, disallowRules: string[]): boolean {
  return !disallowRules.some((rule) => pathMatchesRule(pathname, rule));
}

async function fetchRobots(origin: string): Promise<string[]> {
  try {
    const response = await fetch(`${origin}/robots.txt`, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return [];
    return parseRobots(await response.text());
  } catch {
    return [];
  }
}

/**
 * Descarga y extrae el texto del artículo. Nunca lanza: devuelve
 * `skippedReason` cuando no se puede o no se debe extraer.
 */
export async function extractArticle(url: string): Promise<ExtractedArticle> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { url, title: '', text: '', skippedReason: 'URL no válida' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { url, title: '', text: '', skippedReason: 'protocolo no soportado' };
  }

  const robots = await fetchRobots(parsed.origin);
  if (!isAllowedByRobots(parsed.pathname, robots)) {
    return { url, title: '', text: '', skippedReason: 'robots.txt lo prohíbe' };
  }

  let html: string;
  try {
    const response = await fetch(parsed.toString(), {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'es,en;q=0.8,de;q=0.6',
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      redirect: 'follow',
    });

    if (response.status === 401 || response.status === 402 || response.status === 403) {
      return {
        url,
        title: '',
        text: '',
        skippedReason: `acceso restringido (${response.status}), posible paywall`,
      };
    }
    if (!response.ok) {
      return { url, title: '', text: '', skippedReason: `HTTP ${response.status}` };
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('html')) {
      return { url, title: '', text: '', skippedReason: `contenido no HTML (${contentType})` };
    }

    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > MAX_BYTES) {
      return { url, title: '', text: '', skippedReason: 'respuesta demasiado grande' };
    }
    html = new TextDecoder('utf-8').decode(buffer);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { url, title: '', text: '', skippedReason: `error de red: ${message}` };
  }

  try {
    const dom = new JSDOM(html, { url: parsed.toString() });
    const article = new Readability(dom.window.document).parse();
    const text = (article?.textContent ?? '').replace(/\s+\n/g, '\n').replace(/\s{2,}/g, ' ').trim();

    if (text.length < 400) {
      return { url, title: article?.title ?? '', text: '', skippedReason: 'texto extraído demasiado corto' };
    }

    return {
      url,
      title: article?.title ?? '',
      text: text.slice(0, MAX_TEXT_CHARS),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { url, title: '', text: '', skippedReason: `error de extracción: ${message}` };
  }
}
