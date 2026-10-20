import { mkdtempSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  BANNED_HASHTAG_WORDS,
  CAPTION_CTA,
  HASHTAG_PATTERN,
  MAX_CAPTION_LENGTH,
  buildCaption,
  captionHashtags,
  captionHook,
  hasBannedWord,
  loadHashtags,
  pickHashtags,
  summarySentences,
  truncateAtWord,
} from '../src/caption.js';
import { CATEGORIES } from '../src/types.js';

const hashtags = loadHashtags();

const base = {
  title: 'Un ensayo español mide el efecto del CBD en el dolor crónico',
  summary:
    'Un equipo del Hospital Clínico publica los resultados de un ensayo aleatorizado con 120 pacientes. El estudio mide dolor y calidad de vida durante doce semanas.',
  hook: 'Un ensayo mide el CBD en el dolor crónico',
  author: 'bot',
  sourceName: 'Cáñamo',
  category: 'investigacion',
  hashtags,
} as const;

describe('buildCaption — formato', () => {
  it('empieza por el gancho y acaba en hashtags', () => {
    const caption = buildCaption({ ...base });
    const lines = caption.split('\n\n');

    expect(lines[0]).toBe(base.hook);
    expect(lines.length).toBeGreaterThanOrEqual(4);
    // El último bloque son sólo hashtags, separados por espacios.
    expect(lines[lines.length - 1]).toMatch(/^(#[a-z0-9_]+ ?)+$/);
    expect(captionHashtags(lines[lines.length - 1])).toHaveLength(captionHashtags(caption).length);
  });

  it('lleva la llamada a la acción del contrato, sin URL clicable', () => {
    const caption = buildCaption({ ...base });
    expect(caption).toContain(CAPTION_CTA.es);
    expect(caption).not.toMatch(/https?:\/\//);
  });

  it('cita la fuente sólo si el post lo escribió el bot', () => {
    const delBot = buildCaption({ ...base });
    expect(delBot).toContain('Fuente: Cáñamo');

    const aMano = buildCaption({ ...base, author: 'equipo' });
    expect(aMano).not.toContain('Fuente:');

    const sinFuente = buildCaption({ ...base, sourceName: '' });
    expect(sinFuente).not.toContain('Fuente:');
  });

  it('usa el título si no hay instagramHook', () => {
    const caption = buildCaption({ ...base, hook: '   ' });
    expect(caption.startsWith(base.title)).toBe(true);
    expect(captionHook(null, base.title)).toBe(base.title);
  });

  it('en inglés traduce la llamada a la acción y la etiqueta de la fuente', () => {
    const caption = buildCaption({ ...base, lang: 'en' });
    expect(caption).toContain(CAPTION_CTA.en);
    expect(caption).toContain('Source: Cáñamo');
    expect(caption).not.toContain(CAPTION_CTA.es);
  });

  it('el cuerpo sale del summary en 2–3 frases', () => {
    const caption = buildCaption({ ...base });
    expect(caption).toContain(base.summary);
    expect(
      summarySentences(`${base.summary} Tercera frase. Cuarta que no cabe.`),
    ).toEqual([base.summary.split('. ')[0] + '.', base.summary.split('. ')[1], 'Tercera frase.']);
  });
});

describe('buildCaption — longitud', () => {
  it('nunca pasa de 2200 caracteres', () => {
    const largo = buildCaption({
      ...base,
      hook: 'Gancho '.repeat(50),
      summary: 'Frase de relleno con muchas palabras. '.repeat(120),
    });
    expect(largo.length).toBeLessThanOrEqual(MAX_CAPTION_LENGTH);
  });

  it('aunque recorte, conserva la llamada a la acción y los hashtags', () => {
    const largo = buildCaption({ ...base, summary: 'palabra '.repeat(1000) });
    const tags = captionHashtags(largo);
    expect(largo).toContain(CAPTION_CTA.es);
    expect(tags.length).toBeGreaterThanOrEqual(hashtags.min);
    expect(tags.length).toBeLessThanOrEqual(hashtags.max);
    for (const tag of tags) expect(hashtags.default.concat(...Object.values(hashtags.byCategory))).toContain(tag);
  });

  it('un nombre de fuente larguísimo no rompe el límite', () => {
    const caption = buildCaption({ ...base, sourceName: 'Fuente '.repeat(200) });
    expect(caption.length).toBeLessThanOrEqual(MAX_CAPTION_LENGTH);
    expect(caption).toContain('Fuente:');
    expect(captionHashtags(caption).length).toBeGreaterThanOrEqual(hashtags.min);
  });

  it('truncateAtWord no parte palabras y añade puntos suspensivos', () => {
    expect(truncateAtWord('hola mundo entero', 12)).toBe('hola mundo…');
    expect(truncateAtWord('corto', 100)).toBe('corto');
  });
});

describe('hashtags — lista blanca', () => {
  it('el fichero existe, es válido y cubre las seis categorías', () => {
    expect(hashtags.min).toBe(5);
    expect(hashtags.max).toBe(8);
    for (const category of CATEGORIES) {
      const list = hashtags.byCategory[category];
      expect(list, `falta la categoría ${category} en bot/hashtags.yml`).toBeDefined();
      expect(list.length).toBeGreaterThanOrEqual(hashtags.min);
      expect(list.length).toBeLessThanOrEqual(hashtags.max);
    }
  });

  it('todos los hashtags están en minúsculas, sin acentos ni guiones', () => {
    const all = [...hashtags.default, ...Object.values(hashtags.byCategory).flat()];
    for (const tag of all) expect(tag).toMatch(HASHTAG_PATTERN);
  });

  it('ninguno es de venta, consumo o producto', () => {
    const all = [...hashtags.default, ...Object.values(hashtags.byCategory).flat()];
    for (const tag of all) expect(hasBannedWord(tag), `hashtag vetado: ${tag}`).toBe(false);
    expect(BANNED_HASHTAG_WORDS.length).toBeGreaterThan(0);
  });

  it('pickHashtags devuelve entre 5 y 8, sin duplicados', () => {
    for (const category of CATEGORIES) {
      const tags = pickHashtags(category, hashtags);
      expect(tags.length).toBeGreaterThanOrEqual(hashtags.min);
      expect(tags.length).toBeLessThanOrEqual(hashtags.max);
      expect(new Set(tags).size).toBe(tags.length);
    }
  });

  it('una categoría desconocida cae en la lista por defecto', () => {
    expect(pickHashtags('no-existe', hashtags)).toEqual(hashtags.default.slice(0, hashtags.max));
    expect(pickHashtags(undefined, hashtags).length).toBeGreaterThanOrEqual(hashtags.min);
  });

  it('loadHashtags falla si alguien cuela un hashtag vetado', () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), 'hd-hashtags-'));
    const file = path.join(dir, 'hashtags.yml');
    writeFileSync(
      file,
      ['min: 1', 'max: 2', 'default:', "  - '#weedforsale'"].join('\n'),
      'utf8',
    );
    expect(() => loadHashtags(file)).toThrow(/vetado/);
  });
});
