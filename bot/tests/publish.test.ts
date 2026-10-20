import { readFileSync } from 'node:fs';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';
import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config.js';
import {
  addSeenEntry,
  buildPostFiles,
  cleanSourceUrl,
  renderPost,
  slugify,
} from '../src/publish.js';
import type { FeedItem, SeenState } from '../src/types.js';
import { validateGeneratedPost } from '../src/write.js';

const FIXTURES = path.join(import.meta.dirname, 'fixtures');
const post = validateGeneratedPost(readFileSync(path.join(FIXTURES, 'llm-response-valid.json'), 'utf8'));

const now = new Date('2026-10-20T08:30:00.000Z');

const item: FeedItem = {
  sourceId: 'canamo',
  sourceName: 'Cáñamo',
  sourceWeight: 2,
  defaultCategory: 'investigacion',
  sourceLang: 'es',
  title: 'Un ensayo español mide el efecto del CBD en el dolor crónico',
  url: 'https://canamo.net/noticia/ensayo-cbd-dolor?utm_source=rss',
  canonicalUrl: 'canamo.net/noticia/ensayo-cbd-dolor',
  publishedAt: now,
  summary: 'Resumen del feed.',
};

const config = loadConfig();
const contentDir = path.resolve('/repo/src/content/news');

describe('posts generados — contrato de contenido', () => {
  const { translationKey, files } = buildPostFiles(post, item, now, config, contentDir);

  it('escribe un .md por idioma en la carpeta del contrato', () => {
    expect(files.map((file) => file.path)).toEqual([
      path.join(contentDir, 'es', `${translationKey}.md`),
      path.join(contentDir, 'en', `${translationKey}.md`),
    ]);
  });

  it('usa el mismo translationKey en ES y EN y los campos obligatorios del bot', () => {
    for (const file of files) {
      const yaml = file.content.match(/^---\n([\s\S]*?)\n---/)![1];
      const data = parseYaml(yaml) as Record<string, unknown>;
      expect(data.translationKey).toBe(translationKey);
      expect(data.lang).toBe(file.lang);
      expect(data.author).toBe('bot');
      expect(data.instagram).toBe('pending');
      expect(data.draft).toBe(false);
      expect(data.category).toBe('investigacion');
      expect(data.source).toEqual({
        name: 'Cáñamo',
        url: 'https://canamo.net/noticia/ensayo-cbd-dolor',
      });
      expect(data.instagramHook).toBeTruthy();
      expect(data.date).toBe(now.toISOString());
      expect(String(data.title).length).toBeLessThanOrEqual(90);
      expect(String(data.summary).length).toBeLessThanOrEqual(200);
    }
  });

  it('el cuerpo va después del frontmatter y sin H1', () => {
    for (const file of files) {
      const body = file.content.split(/^---$/m).slice(2).join('---').trim();
      expect(body.length).toBeGreaterThan(100);
      expect(body).not.toMatch(/^# /m);
    }
  });

  it('renderPost genera frontmatter YAML válido', () => {
    const rendered = renderPost(
      {
        title: 'Título: con dos puntos',
        summary: 'Resumen breve del post para listados.',
        date: now.toISOString(),
        lang: 'es',
        translationKey: 'titulo-con-dos-puntos',
        category: 'salud',
        tags: ['cbd', 'dolor'],
        source: { name: 'Cáñamo', url: 'https://canamo.net/x' },
        author: 'bot',
        draft: false,
        instagram: 'pending',
        instagramHook: 'Gancho corto',
      },
      '## Qué ha pasado\n\nTexto.',
    );

    expect(rendered.startsWith('---\n')).toBe(true);
    const yaml = rendered.match(/^---\n([\s\S]*?)\n---/)![1];
    const data = parseYaml(yaml) as Record<string, unknown>;
    expect(data.title).toBe('Título: con dos puntos');
    expect(data.tags).toEqual(['cbd', 'dolor']);
  });
});

describe('cleanSourceUrl', () => {
  it('quita parámetros de seguimiento y el fragmento', () => {
    expect(cleanSourceUrl('https://example.com/a?utm_source=rss&id=3#x')).toBe('https://example.com/a?id=3');
  });

  it('no rompe con URLs inválidas', () => {
    expect(cleanSourceUrl('  no-es-una-url ')).toBe('no-es-una-url');
  });
});

describe('slugify', () => {
  it('convierte el título en slug ascii', () => {
    expect(slugify('Alemania revisa el límite de THC al volante')).toBe('alemania-revisa-el-limite-de-thc-al-volante');
  });

  it('limita la longitud y no deja guiones colgando', () => {
    const slug = slugify('a'.repeat(40) + ' ' + 'b'.repeat(40));
    expect(slug.length).toBeLessThanOrEqual(60);
    expect(slug.endsWith('-')).toBe(false);
  });

  it('tiene un valor por defecto si el título no deja caracteres', () => {
    expect(slugify('!!!')).toBe('noticia');
  });
});

describe('state/seen.json — idempotencia', () => {
  const empty: SeenState = { version: 1, updatedAt: null, seen: [] };

  it('añade la noticia una sola vez aunque se relance', () => {
    const once = addSeenEntry(empty, item, now);
    const twice = addSeenEntry(once, item, new Date(now.getTime() + 3600_000));

    expect(once.seen).toHaveLength(1);
    expect(twice.seen).toHaveLength(1);
    expect(twice.seen[0].url).toBe(item.url);
    expect(twice.seen[0].sourceId).toBe('canamo');
  });

  it('la comparación ignora los parámetros de seguimiento de la URL', () => {
    const once = addSeenEntry(empty, item, now);
    const twice = addSeenEntry(
      once,
      { ...item, url: 'https://www.canamo.net/noticia/ensayo-cbd-dolor#top' },
      now,
    );
    expect(twice.seen).toHaveLength(1);
  });

  it('no muta el estado original', () => {
    addSeenEntry(empty, item, now);
    expect(empty.seen).toHaveLength(0);
  });
});
