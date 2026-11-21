import { describe, expect, it } from 'vitest';

import { evidenceTopicIds } from '../../data/evidence';
import { languages } from '../../i18n';
import {
  evidenceAlternates,
  evidenceContent,
  evidenceHubPath,
  evidencePageSchema,
  evidenceTopicPath,
  otherTopics,
} from './index';

describe('fichas de evidencia', () => {
  it('cada idioma tiene los diez temas y rutas únicas', () => {
    const all = new Set<string>();
    for (const lang of languages) {
      for (const id of evidenceTopicIds) {
        const path = evidenceTopicPath(lang, id);
        expect(path.startsWith(evidenceHubPath(lang))).toBe(true);
        expect(all.has(path)).toBe(false);
        all.add(path);
      }
    }
    expect(all.size).toBe(languages.length * evidenceTopicIds.length);
  });

  it('EN vive sin prefijo y el resto con su idioma delante', () => {
    expect(evidenceHubPath('en')).toBe('/evidence/');
    expect(evidenceHubPath('es')).toBe('/es/evidencia/');
    expect(evidenceTopicPath('es', 'pain')).toBe('/es/evidencia/cannabis-dolor-cronico/');
  });

  it('las alternativas de idioma cubren los ocho idiomas', () => {
    expect(evidenceAlternates('pain').map((item) => item.lang)).toEqual([...languages]);
  });

  it('otros temas: primero los del mismo grupo y nunca el propio', () => {
    const others = otherTopics('psychosis');
    expect(others.some((topic) => topic.id === 'psychosis')).toBe(false);
    expect(others[0].group).toBe('risk');
    expect(others).toHaveLength(evidenceTopicIds.length - 1);
  });

  it('el esquema rechaza slugs con tildes o repetidos', () => {
    const es = structuredClone(evidenceContent.es);
    es.topics.pain.slug = 'cannabis-dolor-crónico';
    expect(evidencePageSchema.safeParse(es).success).toBe(false);
    const dup = structuredClone(evidenceContent.es);
    dup.topics.sleep.slug = dup.topics.pain.slug;
    expect(evidencePageSchema.safeParse(dup).success).toBe(false);
  });
});
