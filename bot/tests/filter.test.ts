import { describe, expect, it } from 'vitest';
import {
  canonicalizeUrl,
  isFresh,
  normalizeText,
  selectArticle,
  titleSimilarity,
  trigrams,
} from '../src/filter.js';
import { loadConfig } from '../src/config.js';
import type { BotConfig, FeedItem, SeenState } from '../src/types.js';

const NOW = new Date('2026-10-20T08:30:00.000Z');

const baseConfig = loadConfig();

/** Config sin palabras clave ni umbral: el score es el peso de la fuente. */
function plainConfig(overrides: Partial<BotConfig> = {}): BotConfig {
  return {
    ...baseConfig,
    minScore: 0,
    keywords: {},
    ...overrides,
  };
}

function makeItem(overrides: Partial<FeedItem> = {}): FeedItem {
  const url = overrides.url ?? 'https://example.com/noticia';
  return {
    sourceId: 'test-source',
    sourceName: 'Test Source',
    sourceWeight: 2,
    defaultCategory: 'investigacion',
    sourceLang: 'en',
    title: 'Estudio sobre cannabinoides y dolor crónico',
    url,
    canonicalUrl: canonicalizeUrl(url),
    publishedAt: new Date(NOW.getTime() - 2 * 3600_000),
    summary: 'Un estudio publicado en una revista revisada por pares.',
    ...overrides,
  };
}

const emptySeen: SeenState = { version: 1, updatedAt: null, seen: [] };

describe('normalizeText y trigramas', () => {
  it('quita acentos, mayúsculas y puntuación', () => {
    expect(normalizeText('  Cáñamo: ¡Estudio!  ')).toBe('canamo estudio');
  });

  it('dos títulos iguales con distinta puntuación son idénticos', () => {
    expect(titleSimilarity('Alemania revisa el límite de THC', 'Alemania revisa el limite de THC.')).toBe(1);
  });

  it('títulos distintos no se parecen', () => {
    expect(titleSimilarity('Alemania revisa el límite de THC', 'Portugal abre consulta pública')).toBeLessThan(0.3);
  });

  it('los trigramas ignoran acentos y mayúsculas', () => {
    expect(trigrams('CANNABIS')).toEqual(trigrams('cannabis'));
  });
});

describe('canonicalizeUrl', () => {
  it('elimina parámetros de seguimiento, www, fragmento y barra final', () => {
    expect(
      canonicalizeUrl('https://www.example.com/noticia/?utm_source=x&utm_medium=y&fbclid=1#top'),
    ).toBe('example.com/noticia');
  });

  it('conserva los parámetros significativos ordenados', () => {
    expect(canonicalizeUrl('https://example.com/a?id=7&page=2')).toBe('example.com/a?id=7&page=2');
    expect(canonicalizeUrl('https://example.com/a?page=2&id=7')).toBe('example.com/a?id=7&page=2');
  });

  it('no rompe con URLs inválidas', () => {
    expect(canonicalizeUrl('  ***  ')).toBe('***');
  });
});

describe('isFresh', () => {
  it('acepta noticias de hace 71 horas', () => {
    expect(isFresh(new Date(NOW.getTime() - 71 * 3600_000), NOW, 72)).toBe(true);
  });

  it('descarta noticias de hace 73 horas', () => {
    expect(isFresh(new Date(NOW.getTime() - 73 * 3600_000), NOW, 72)).toBe(false);
  });

  it('descarta noticias sin fecha', () => {
    expect(isFresh(null, NOW, 72)).toBe(false);
  });
});

describe('selectArticle — frescura', () => {
  it('descarta la noticia vieja y rechaza el motivo', () => {
    const result = selectArticle({
      items: [makeItem({ publishedAt: new Date(NOW.getTime() - 96 * 3600_000) })],
      config: plainConfig(),
      seen: emptySeen,
      existingTitles: [],
      now: NOW,
    });

    expect(result.selected).toBeNull();
    expect(result.rejected[0]?.reason).toBe('no-fresco');
  });

  it('descarta la noticia sin fecha', () => {
    const result = selectArticle({
      items: [makeItem({ publishedAt: null })],
      config: plainConfig(),
      seen: emptySeen,
      existingTitles: [],
      now: NOW,
    });

    expect(result.selected).toBeNull();
    expect(result.rejected[0]?.reason).toBe('sin-fecha');
  });
});

describe('selectArticle — vetos', () => {
  it.each([
    ['El precio del gramo sube en los clubs de Barcelona', 'precios'],
    ['Las mejores cepas para este verano', 'cepas'],
    ['Receta de brownies cannábicos paso a paso', 'recetas'],
    ['La policía encuentra 200 plantas en un piso', 'sensacionalismo'],
    ['Oferta de la semana en el dispensario', 'venta'],
  ])('veta «%s» por el tema %s', (title, vetoPattern) => {
    const result = selectArticle({
      items: [makeItem({ title, summary: title })],
      config: baseConfig,
      seen: emptySeen,
      existingTitles: [],
      now: NOW,
    });

    expect(result.selected).toBeNull();
    const veto = result.rejected.find((entry) => entry.reason === 'veto');
    expect(veto).toBeDefined();
    expect(result.rejected.some((entry) => entry.detail?.includes(vetoPattern))).toBe(true);
  });

  it('un patrón que se queda en una sola letra no veta todo', () => {
    const result = selectArticle({
      items: [makeItem({ title: 'Un ensayo clínico estudia el cannabidiol en pacientes' })],
      config: { ...plainConfig(), vetos: [{ id: 'roto', label: 'patrón roto', patterns: ['€/g'] }] },
      seen: emptySeen,
      existingTitles: [],
      now: NOW,
    });

    expect(result.selected).not.toBeNull();
  });

  it('los patrones de config.yml son lo bastante específicos', () => {
    const patterns = [
      ...baseConfig.vetos.flatMap((veto) => veto.patterns),
      ...Object.values(baseConfig.keywords).flatMap((rules) => rules.map((rule) => rule.pattern)),
    ];
    const useless = patterns.filter((pattern) => normalizeText(pattern).length < 3);
    expect(useless).toEqual([]);
  });

  it('no veta una noticia de investigación legítima', () => {
    const result = selectArticle({
      items: [
        makeItem({
          title: 'Un ensayo clínico estudia el cannabidiol en pacientes con epilepsia',
          summary: 'Estudio aleatorizado con 120 pacientes publicado en una revista europea.',
          sourceWeight: 3,
        }),
      ],
      config: baseConfig,
      seen: emptySeen,
      existingTitles: [],
      now: NOW,
    });

    expect(result.selected).not.toBeNull();
  });
});

describe('selectArticle — deduplicado', () => {
  it('deduplica por URL canónica aunque cambien los parámetros', () => {
    const result = selectArticle({
      items: [
        makeItem({ url: 'https://example.com/noticia?utm_source=rss', sourceWeight: 1, title: 'Titular uno sobre regulación' }),
        makeItem({ url: 'https://www.example.com/noticia#x', sourceWeight: 3, title: 'Titular dos sobre regulación' }),
      ],
      config: plainConfig(),
      seen: emptySeen,
      existingTitles: [],
      now: NOW,
    });

    expect(result.rejected.some((entry) => entry.reason === 'duplicado-url')).toBe(true);
    expect(result.selected?.sourceWeight).toBe(3);
  });

  it('deduplica por similitud de título (>= 0,6) con distinta URL', () => {
    const result = selectArticle({
      items: [
        makeItem({ url: 'https://a.example.com/x', title: 'Alemania revisa el límite de THC al volante' }),
        makeItem({ url: 'https://b.example.com/y', title: 'Alemania revisa el límite de THC al volante' }),
      ],
      config: plainConfig(),
      seen: emptySeen,
      existingTitles: [],
      now: NOW,
    });

    expect(result.rejected.some((entry) => entry.reason === 'duplicado-titulo')).toBe(true);
    expect(result.selected).not.toBeNull();
  });

  it('descarta URLs ya vistas en state/seen.json', () => {
    const seen: SeenState = {
      version: 1,
      updatedAt: NOW.toISOString(),
      seen: [
        {
          url: 'https://example.com/noticia',
          title: 'Otra cosa',
          seenAt: NOW.toISOString(),
          sourceId: 'test-source',
        },
      ],
    };

    const result = selectArticle({
      items: [makeItem()],
      config: plainConfig(),
      seen,
      existingTitles: [],
      now: NOW,
    });

    expect(result.selected).toBeNull();
    expect(result.rejected[0]?.reason).toBe('duplicado-url');
  });

  it('descarta títulos parecidos a un post ya publicado', () => {
    const result = selectArticle({
      items: [makeItem({ title: 'Alemania revisa el límite de THC al volante' })],
      config: plainConfig(),
      seen: emptySeen,
      existingTitles: ['Alemania revisa el límite de THC al volante'],
      now: NOW,
    });

    expect(result.selected).toBeNull();
    expect(result.rejected[0]?.reason).toBe('duplicado-titulo');
  });
});

describe('selectArticle — puntuación', () => {
  it('elige la noticia con más puntuación y sólo una', () => {
    const result = selectArticle({
      items: [
        makeItem({ url: 'https://example.com/a', title: 'Noticia floja', sourceWeight: 1 }),
        makeItem({ url: 'https://example.com/b', title: 'Noticia fuerte', sourceWeight: 3 }),
        makeItem({ url: 'https://example.com/c', title: 'Noticia media', sourceWeight: 2 }),
      ],
      config: plainConfig(),
      seen: emptySeen,
      existingTitles: [],
      now: NOW,
    });

    expect(result.selected?.url).toBe('https://example.com/b');
    // max_per_run = 1: sólo se devuelve una noticia publicable por ejecución.
    expect(result.scored).toHaveLength(1);
  });

  it('no publica nada si nada supera el umbral de puntuación', () => {
    const result = selectArticle({
      items: [makeItem({ title: 'Nueva colección de moda urbana', summary: 'Ropa para el otoño.', sourceWeight: 1 })],
      config: baseConfig,
      seen: emptySeen,
      existingTitles: [],
      now: NOW,
    });

    expect(result.selected).toBeNull();
    expect(result.rejected.some((entry) => entry.reason === 'baja-puntuacion')).toBe(true);
  });

  it('en empate gana la noticia más reciente', () => {
    const result = selectArticle({
      items: [
        makeItem({
          url: 'https://example.com/a',
          title: 'Un estudio sobre cannabinoides revisa la evidencia',
          publishedAt: new Date(NOW.getTime() - 10 * 3600_000),
        }),
        makeItem({
          url: 'https://example.com/b',
          title: 'Portugal abre una consulta pública sobre regulación',
          publishedAt: new Date(NOW.getTime() - 1 * 3600_000),
        }),
      ],
      config: plainConfig(),
      seen: emptySeen,
      existingTitles: [],
      now: NOW,
    });

    expect(result.selected?.url).toBe('https://example.com/b');
  });
});
