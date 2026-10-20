import { describe, expect, it } from 'vitest';

import { createNewsSchema, newsSchema } from './schema';

/** Post mínimo válido, escrito por el equipo. */
const equipoPost = {
  title: 'Nace High Doctor Foundation',
  summary: 'Una fundación independiente para la investigación y la educación sobre cannabinoides.',
  date: '2026-10-01',
  lang: 'es' as const,
  translationKey: 'foundation-launch',
  category: 'fundacion' as const,
  tags: ['fundacion', 'lanzamiento'],
  author: 'equipo',
};

/** Post del bot: necesita `source` por contrato. */
const botPost = {
  ...equipoPost,
  author: 'bot',
  category: 'investigacion' as const,
};

describe('esquema de la colección news', () => {
  it('acepta un post completo escrito por el equipo', () => {
    const result = newsSchema.safeParse(equipoPost);
    expect(result.success).toBe(true);
  });

  it('rechaza un post del bot sin source', () => {
    const result = newsSchema.safeParse(botPost);
    expect(result.success).toBe(false);
    if (result.success) return;
    const paths = result.error.issues.map((issue) => issue.path.join('.'));
    expect(paths).toContain('source');
  });

  it('acepta un post del bot con source', () => {
    const result = newsSchema.safeParse({
      ...botPost,
      source: { name: 'EMCDDA', url: 'https://www.emcdda.europa.eu/' },
    });
    expect(result.success).toBe(true);
  });

  it('aplica los valores por defecto de draft, instagram y tags', () => {
    const parsed = newsSchema.parse(equipoPost);
    expect(parsed.draft).toBe(false);
    expect(parsed.instagram).toBe('pending');
    expect(parsed.tags).toEqual(['fundacion', 'lanzamiento']);
    expect(parsed.date).toBeInstanceOf(Date);
  });

  it('rechaza un title de más de 90 caracteres', () => {
    const result = newsSchema.safeParse({ ...equipoPost, title: 'a'.repeat(91) });
    expect(result.success).toBe(false);
  });

  it('rechaza un summary de más de 200 caracteres', () => {
    const result = newsSchema.safeParse({ ...equipoPost, summary: 'a'.repeat(201) });
    expect(result.success).toBe(false);
  });

  it('rechaza un instagramHook de más de 80 caracteres', () => {
    const result = newsSchema.safeParse({ ...equipoPost, instagramHook: 'a'.repeat(81) });
    expect(result.success).toBe(false);
  });

  it('rechaza una categoría o un idioma que no están en el enum', () => {
    expect(newsSchema.safeParse({ ...equipoPost, category: 'deportes' }).success).toBe(false);
    expect(newsSchema.safeParse({ ...equipoPost, lang: 'de' }).success).toBe(false);
  });

  it('rechaza un estado de Instagram desconocido', () => {
    expect(newsSchema.safeParse({ ...equipoPost, instagram: 'scheduled' }).success).toBe(false);
  });

  it('valida la portada con el schema que recibe (image() en Astro)', () => {
    const schema = createNewsSchema();
    expect(schema.safeParse({ ...equipoPost, cover: 'portada.jpg' }).success).toBe(true);
    expect(schema.safeParse({ ...equipoPost, cover: 42 }).success).toBe(false);
  });
});
