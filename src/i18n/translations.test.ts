import { describe, expect, it } from 'vitest';

import { dictionary, languages, type Lang } from './index';

/**
 * Guardas de calidad de los textos (prompt 04, paso 2 y verificación).
 *
 * `scripts/check-i18n.mjs` ya comprueba claves y valores vacíos en el build;
 * aquí se añade la parte que el script no puede ver: que una traducción no sea
 * el texto inglés copiado y que el titular del hero quepa en menos de diez
 * palabras (si no, la maquetación se rompe y el titular deja de decir nada).
 */

/** Palabras que valen igual en todos los idiomas (marcas y nombres propios). */
const SHARED_BY_DESIGN = new Set([
  'ft_brand',
  'ft_motto',
  'nav_maryjane',
  'ev_city',
  'ft_loc',
]);

const words = (text: string): string[] => text.split(/\s+/).filter(Boolean);

const literals = (lang: Lang): Record<string, string> =>
  dictionary(lang) as unknown as Record<string, string>;

describe('diccionarios de i18n', () => {
  it('todos los idiomas tienen las mismas claves que el inglés y ningún valor vacío', () => {
    const base = literals('en');

    for (const lang of languages) {
      const current = literals(lang);
      expect(Object.keys(current).sort(), `${lang} no coincide con en`).toEqual(
        Object.keys(base).sort(),
      );

      for (const [key, value] of Object.entries(current)) {
        expect(typeof value, `${lang}:${key} no es texto`).toBe('string');
        expect(value.trim(), `${lang}:${key} está vacío`).not.toBe('');
      }
    }
  });

  it('no deja textos sin traducir (iguales al inglés y de más de tres palabras)', () => {
    const base = literals('en');
    const untranslated: string[] = [];

    for (const lang of languages) {
      if (lang === 'en') continue;
      for (const [key, value] of Object.entries(literals(lang))) {
        if (SHARED_BY_DESIGN.has(key)) continue;
        if (value === base[key] && words(value).length > 3) {
          untranslated.push(`${lang}:${key} → "${value}"`);
        }
      }
    }

    expect(untranslated).toEqual([]);
  });

  it('el titular del hero dice qué es y para quién en menos de diez palabras', () => {
    for (const lang of languages) {
      const title = literals(lang).hero_title;
      expect(words(title).length, `${lang}: "${title}"`).toBeLessThan(10);
    }
  });

  it('no usa frases vacías del tipo "construyendo el futuro juntos"', () => {
    // Prompt 04, paso 2: estas fórmulas no dicen nada y estaban en la web vieja.
    const cliché =
      /futuro|future|zukunft|toekomst|przyszł|avenir|futur|juntos|together|gemeinsam|ensemble|insieme/i;
    const keys = [
      'hero_title',
      'hero_subtitle',
      'mission_lead',
      'mission_desc',
      'form_subtitle',
      'mj_desc',
    ] as const;

    const offenders: string[] = [];
    for (const lang of languages) {
      const current = literals(lang);
      for (const key of keys) {
        if (cliché.test(current[key])) offenders.push(`${lang}:${key} → "${current[key]}"`);
      }
    }

    expect(offenders).toEqual([]);
  });

  it('la palabra subrayada del hero existe dentro del titular', () => {
    for (const lang of languages) {
      const { hero_title: title, hero_title_hl: highlight } = literals(lang);
      expect(title.toLocaleLowerCase(), `${lang}: "${highlight}"`).toContain(
        highlight.toLocaleLowerCase(),
      );
    }
  });
});
