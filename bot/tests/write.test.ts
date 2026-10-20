import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config.js';
import type { BotConfig, FeedItem } from '../src/types.js';
import type { CompletionRequest, LLMProvider } from '../src/llm.js';
import {
  ValidationError,
  extractJson,
  generatePost,
  ngramOverlap,
  validateGeneratedPost,
} from '../src/write.js';

const FIXTURES = path.join(import.meta.dirname, 'fixtures');
const validJson = readFileSync(path.join(FIXTURES, 'llm-response-valid.json'), 'utf8');
const fencedResponse = readFileSync(path.join(FIXTURES, 'llm-response-fenced.txt'), 'utf8');
const originalArticle = readFileSync(path.join(FIXTURES, 'article-en.txt'), 'utf8');

const now = new Date('2026-10-20T08:30:00.000Z');

const item: FeedItem = {
  sourceId: 'canamo',
  sourceName: 'Cáñamo',
  sourceWeight: 2,
  defaultCategory: 'investigacion',
  sourceLang: 'es',
  title: 'Un ensayo español mide el efecto del CBD en el dolor crónico',
  url: 'https://canamo.net/noticia/ensayo-cbd-dolor',
  canonicalUrl: 'canamo.net/noticia/ensayo-cbd-dolor',
  publishedAt: new Date(now.getTime() - 3600_000),
  summary: 'Un ensayo clínico español publica resultados preliminares sobre CBD y dolor crónico.',
};

function testConfig(overrides: Partial<BotConfig['llm']> = {}): BotConfig {
  const base = loadConfig();
  return {
    ...base,
    // Los fixtures son cortos: se baja el mínimo para no medir longitud aquí.
    llm: { ...base.llm, minWords: 10, maxWords: 800, maxValidationRetries: 1, ...overrides },
  };
}

/** Proveedor falso que devuelve respuestas en orden y guarda los prompts. */
class FakeProvider implements LLMProvider {
  readonly id = 'fake';
  readonly model = 'fake-model';
  readonly prompts: string[] = [];

  constructor(private readonly responses: string[]) {}

  async complete(request: CompletionRequest): Promise<string> {
    this.prompts.push(request.user);
    const response = this.responses[Math.min(this.prompts.length - 1, this.responses.length - 1)];
    return response;
  }
}

describe('validador del JSON del LLM', () => {
  it('acepta una respuesta válida del fixture', () => {
    const post = validateGeneratedPost(validJson);
    expect(post.category).toBe('investigacion');
    expect(post.es.title.length).toBeLessThanOrEqual(90);
    expect(post.en.summary.length).toBeLessThanOrEqual(200);
    expect(post.es.tags.length).toBeGreaterThanOrEqual(2);
  });

  it('acepta JSON envuelto en vallas de markdown con texto alrededor', () => {
    const post = validateGeneratedPost(fencedResponse);
    expect(post.category).toBe('legislacion');
    expect(post.en.title).toBe('Germany reviews its THC driving limit');
  });

  it('falla si falta un idioma', () => {
    const broken = JSON.parse(validJson);
    delete broken.en;
    expect(() => validateGeneratedPost(JSON.stringify(broken))).toThrow(ValidationError);
    try {
      validateGeneratedPost(JSON.stringify(broken));
    } catch (error) {
      expect((error as ValidationError).issues.join(' ')).toContain('en');
    }
  });

  it('falla si el título pasa de 90 caracteres', () => {
    const broken = JSON.parse(validJson);
    broken.es.title = 'a'.repeat(91);
    expect(() => validateGeneratedPost(JSON.stringify(broken))).toThrow(/contrato/i);
  });

  it('falla si el resumen pasa de 200 caracteres', () => {
    const broken = JSON.parse(validJson);
    broken.en.summary = 'b'.repeat(201);
    expect(() => validateGeneratedPost(JSON.stringify(broken))).toThrow(ValidationError);
  });

  it('falla si el instagramHook pasa de 80 caracteres', () => {
    const broken = JSON.parse(validJson);
    broken.es.instagramHook = 'c'.repeat(81);
    expect(() => validateGeneratedPost(JSON.stringify(broken))).toThrow(ValidationError);
  });

  it('falla con una categoría fuera del contrato', () => {
    const broken = JSON.parse(validJson);
    broken.category = 'deportes';
    expect(() => validateGeneratedPost(JSON.stringify(broken))).toThrow(ValidationError);
  });

  it('falla si no es JSON', () => {
    expect(() => validateGeneratedPost('Lo siento, no puedo hacer eso.')).toThrow(ValidationError);
  });

  it('extractJson recorta al objeto aunque haya preámbulo', () => {
    expect(extractJson('bla bla {"a":1} bla')).toBe('{"a":1}');
  });
});

describe('control anti-copia', () => {
  it('detecta el 100 % cuando el texto es el original', () => {
    expect(ngramOverlap(originalArticle, originalArticle, 8)).toBe(1);
  });

  it('no marca un resumen propio en otro idioma', () => {
    const post = validateGeneratedPost(validJson);
    expect(ngramOverlap(post.es.body, originalArticle, 8)).toBe(0);
  });

  it('detecta una copia parcial por encima del 15 %', () => {
    const words = originalArticle.split(/\s+/);
    const copied = words.slice(0, 80).join(' ') + ' y luego texto propio que no viene del original.';
    expect(ngramOverlap(copied, originalArticle, 8)).toBeGreaterThan(0.15);
  });
});

describe('generatePost', () => {
  it('devuelve el post validado con un solo intento', async () => {
    const provider = new FakeProvider([validJson]);
    const result = await generatePost({
      item,
      article: { url: item.url, title: item.title, text: originalArticle },
      provider,
      config: testConfig(),
    });

    expect(result.attempts).toBe(1);
    expect(result.post.category).toBe('investigacion');
    expect(provider.prompts[0]).toContain('Texto del artículo');
  });

  it('reintenta una vez si el JSON no valida', async () => {
    const provider = new FakeProvider(['{ "es": {}, "en": {} }', validJson]);
    const result = await generatePost({
      item,
      article: { url: item.url, title: item.title, text: originalArticle },
      provider,
      config: testConfig(),
    });

    expect(result.attempts).toBe(2);
    expect(provider.prompts[1]).toContain('no cumplía el contrato');
  });

  it('aborta si el segundo intento tampoco valida', async () => {
    const provider = new FakeProvider(['no es json', 'sigue sin ser json']);
    await expect(
      generatePost({
        item,
        article: { url: item.url, title: item.title, text: originalArticle },
        provider,
        config: testConfig(),
      }),
    ).rejects.toThrow(/no devolvió un JSON válido/i);
  });

  it('reescribe cuando copia y descarta si vuelve a copiar', async () => {
    const copied = JSON.parse(validJson);
    copied.es.body = originalArticle;
    copied.en.body = originalArticle;
    const provider = new FakeProvider([JSON.stringify(copied), JSON.stringify(copied)]);

    await expect(
      generatePost({
        item,
        article: { url: item.url, title: item.title, text: originalArticle },
        provider,
        config: testConfig(),
      }),
    ).rejects.toThrow(/descartado/i);

    expect(provider.prompts[1]).toContain('copiaba frases del original');
  });

  it('acepta la reescritura cuando la segunda versión es original', async () => {
    const copied = JSON.parse(validJson);
    copied.es.body = originalArticle;
    copied.en.body = originalArticle;
    const provider = new FakeProvider([JSON.stringify(copied), validJson]);

    const result = await generatePost({
      item,
      article: { url: item.url, title: item.title, text: originalArticle },
      provider,
      config: testConfig(),
    });

    expect(result.attempts).toBe(2);
    expect(result.overlap).toBeLessThanOrEqual(0.15);
  });
});
