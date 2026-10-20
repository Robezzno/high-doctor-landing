/**
 * Caption (pie de foto) del reclamo de Instagram.
 *
 * Reglas del prompt 08 (docs/prompts/08-instagram.md):
 * - Línea 1: `instagramHook` o el título — el gancho.
 * - 2–3 líneas a partir del `summary`.
 * - "Léela completa en highdoctor.foundation (enlace en la bio)": los enlaces
 *   del caption no son clicables en Instagram.
 * - "Fuente: <nombre>" sólo si el post lo escribió el bot.
 * - Entre 5 y 8 hashtags de `bot/hashtags.yml` (lista blanca por categoría).
 * - Máximo 2200 caracteres.
 *
 * Todo es puro (sin red) para poder testearlo con vitest.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';
import { BOT_DIR } from './config.js';

/** Límite duro de Instagram para el pie de foto. */
export const MAX_CAPTION_LENGTH = 2200;

export type CaptionLang = 'es' | 'en';

/** Llamada a la acción. Sin URL: en Instagram no sería clicable. */
export const CAPTION_CTA: Record<CaptionLang, string> = {
  es: 'Léela completa en highdoctor.foundation (enlace en la bio)',
  en: 'Read the full story at highdoctor.foundation (link in bio)',
};

/** Etiqueta de la fuente citada. */
export const CAPTION_SOURCE_LABEL: Record<CaptionLang, string> = {
  es: 'Fuente',
  en: 'Source',
};

/**
 * Un hashtag válido: minúsculas, sin espacios, sin acentos y sin guiones.
 * Instagram no admite guiones en los hashtags.
 */
export const HASHTAG_PATTERN = /^#[a-z][a-z0-9_]{0,38}$/;

/**
 * Palabras que nunca deben aparecer dentro de un hashtag de esta lista:
 * venta, consumo, productos y precios. Es una red de seguridad además de la
 * revisión a mano (ver la cabecera de bot/hashtags.yml).
 */
export const BANNED_HASHTAG_WORDS = [
  'buy',
  'sale',
  'shop',
  'store',
  'dispensary',
  'delivery',
  'price',
  'cheap',
  'weed',
  'kush',
  'strain',
  'seeds',
  'smoke',
  'smoking',
  'stoner',
  'high420',
  '420',
  'thcweed',
  'recipe',
];

export interface HashtagConfig {
  min: number;
  max: number;
  default: string[];
  byCategory: Record<string, string[]>;
}

/** Normaliza a la forma que admite Instagram (`#cannabisresearch`). */
export function normalizeHashtag(tag: string): string {
  const trimmed = tag.trim().toLowerCase();
  const withHash = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
  return withHash.replace(/[^a-z0-9_#]/g, '');
}

export function isValidHashtag(tag: string): boolean {
  return HASHTAG_PATTERN.test(tag);
}

/** `true` si el hashtag contiene una palabra vedada (venta/consumo). */
export function hasBannedWord(tag: string): boolean {
  const body = tag.replace(/^#/, '').toLowerCase();
  return BANNED_HASHTAG_WORDS.some((word) => body.includes(word));
}

/** Carga y valida `bot/hashtags.yml`. Falla en voz alta si el fichero está mal. */
export function loadHashtags(file = path.join(BOT_DIR, 'hashtags.yml')): HashtagConfig {
  const raw = parseYaml(readFileSync(file, 'utf8')) as Record<string, unknown>;

  const normalizeList = (list: unknown, where: string): string[] => {
    if (!Array.isArray(list)) throw new Error(`hashtags.yml: "${where}" debe ser una lista`);
    return list.map((entry) => {
      const tag = normalizeHashtag(String(entry));
      if (!isValidHashtag(tag)) throw new Error(`hashtags.yml: hashtag no válido en ${where}: "${String(entry)}"`);
      if (hasBannedWord(tag)) throw new Error(`hashtags.yml: hashtag vetado en ${where}: "${tag}"`);
      return tag;
    });
  };

  const byCategory: Record<string, string[]> = {};
  for (const [category, list] of Object.entries((raw.by_category ?? {}) as Record<string, unknown>)) {
    byCategory[category] = normalizeList(list, `by_category.${category}`);
  }

  const config: HashtagConfig = {
    min: Number(raw.min ?? 5),
    max: Number(raw.max ?? 8),
    default: normalizeList(raw.default ?? [], 'default'),
    byCategory,
  };

  if (config.min < 1) throw new Error('hashtags.yml: "min" tiene que ser >= 1');
  if (config.max < config.min) throw new Error('hashtags.yml: "max" no puede ser menor que "min"');
  if (config.max > 30) throw new Error('hashtags.yml: "max" es demasiado alto (Instagram no gana nada con 30)');
  if (config.default.length + Math.max(0, ...Object.values(byCategory).map((list) => list.length)) < config.min) {
    throw new Error('hashtags.yml: no hay hashtags suficientes para llegar al mínimo');
  }
  for (const [category, list] of Object.entries(byCategory)) {
    for (const tag of list) {
      if (!isValidHashtag(tag)) throw new Error(`hashtags.yml: hashtag no válido en ${category}: "${tag}"`);
    }
  }

  return config;
}

/**
 * Hashtags del caption: los de la categoría y, si no llega al mínimo, los de
 * `default`. Sin duplicados, entre `min` y `max`. Una categoría desconocida
 * (o vacía) cae en `default`, nunca deja el caption sin hashtags.
 */
export function pickHashtags(category: string | null | undefined, config: HashtagConfig): string[] {
  const fromCategory = (category && config.byCategory[category]) || [];
  const candidates = [...fromCategory, ...config.default];
  const picked: string[] = [];
  for (const tag of candidates) {
    if (!isValidHashtag(tag) || hasBannedWord(tag)) continue;
    if (picked.includes(tag)) continue;
    picked.push(tag);
    if (picked.length >= config.max) break;
  }
  if (picked.length < Math.min(config.min, config.max)) {
    throw new Error(
      `hashtags.yml: sólo ${picked.length} hashtags válidos para "${category ?? 'sin categoría'}" (mínimo ${config.min})`,
    );
  }
  return picked.slice(0, config.max);
}

/** Primera línea del caption: el gancho, o el título si falta. */
export function captionHook(hook: string | null | undefined, title: string): string {
  const clean = (value: string | null | undefined) =>
    String(value ?? '')
      .replace(/\s+/g, ' ')
      .trim();
  return clean(hook) || clean(title);
}

/**
 * Recorta el texto a `maxLength` caracteres sin partir palabras y con puntos
 * suspensivos. Se usa para que el caption nunca pase del límite de Instagram.
 */
export function truncateAtWord(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  if (maxLength <= 1) return text.slice(0, Math.max(0, maxLength));
  const cut = text.slice(0, maxLength - 1);
  const lastSpace = cut.lastIndexOf(' ');
  const base = lastSpace > maxLength * 0.5 ? cut.slice(0, lastSpace) : cut;
  return `${base.replace(/[\s,;:.!?…-]+$/, '')}…`;
}

/** Frases del summary que se usan como cuerpo (2–3 líneas). */
export function summarySentences(summary: string, maxSentences = 3): string[] {
  return String(summary ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(/(?<=[.!?…])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .slice(0, maxSentences);
}

export interface CaptionInput {
  title: string;
  summary: string;
  /** `instagramHook` del frontmatter; si falta se usa el título. */
  hook?: string | null;
  /** `author` del frontmatter: `bot` añade la línea de la fuente. */
  author?: string | null;
  /** `source.name` del frontmatter. */
  sourceName?: string | null;
  /** Categoría del contrato de contenido. */
  category: string;
  lang?: CaptionLang;
  /** Configuración ya cargada (los tests la inyectan). */
  hashtags?: HashtagConfig;
}

/**
 * Caption completo, listo para `image_url` + `caption` del contenedor.
 * Los hashtags y la llamada a la acción nunca se recortan: si el texto no
 * cabe, se recorta el gancho y el resumen.
 */
export function buildCaption(input: CaptionInput): string {
  const lang: CaptionLang = input.lang === 'en' ? 'en' : 'es';
  const hashtags = input.hashtags ?? loadHashtags();
  const tags = pickHashtags(input.category, hashtags).join(' ');

  const hook = captionHook(input.hook, input.title);
  const body = summarySentences(input.summary).join(' ');

  const tailBlocks = [CAPTION_CTA[lang]];
  // La fuente se recorta: un nombre larguísimo no puede comerse el caption.
  const sourceName = String(input.sourceName ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
  if (String(input.author ?? '').trim() === 'bot' && sourceName) {
    tailBlocks.push(`${CAPTION_SOURCE_LABEL[lang]}: ${sourceName}`);
  }
  tailBlocks.push(tags);

  const tail = tailBlocks.join('\n\n');
  const separator = 2; // dos saltos de línea entre el texto y el resto
  const available = MAX_CAPTION_LENGTH - tail.length - separator;

  const text = body ? `${hook}\n\n${body}` : hook;
  return `${truncateAtWord(text, Math.max(0, available))}\n\n${tail}`;
}

/** Palabras del caption que no son hashtags (para tests y depuración). */
export function captionHashtags(caption: string): string[] {
  return caption.match(/#[a-z0-9_]+/g) ?? [];
}
