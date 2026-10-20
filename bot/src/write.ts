/**
 * Redacción con el LLM: prompt, validación con Zod y control anti-copia.
 *
 * El contrato del post está en docs/CONTENIDO.md. Si la respuesta no valida se
 * reintenta una vez con los errores delante; si vuelve a fallar se aborta sin
 * publicar. Después se comprueba que el texto no copie el original (> 15 % de
 * 8-gramas en común ⇒ se reescribe una vez o se descarta).
 */
import { z } from 'zod';
import { normalizeText } from './filter.js';
import { CATEGORIES } from './types.js';
import type { BotConfig, ExtractedArticle, FeedItem, GeneratedPost } from './types.js';
import type { LLMProvider as Provider } from './llm.js';

const localizedSchema = z.object({
  title: z.string().trim().min(10).max(90),
  summary: z.string().trim().min(40).max(200),
  body: z.string().trim().min(200),
  instagramHook: z.string().trim().min(10).max(80),
  tags: z.array(z.string().trim().min(2).max(30)).min(2).max(6),
});

/** JSON exacto que debe devolver el LLM. */
export const PostSchema = z.object({
  es: localizedSchema,
  en: localizedSchema,
  category: z.enum(CATEGORIES),
});

export type ValidatedPost = z.infer<typeof PostSchema>;

/** Quita vallas de Markdown y recorta al primer objeto JSON. */
export function extractJson(raw: string): string {
  let text = raw.trim();
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) text = fenced[1].trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return text;
  return text.slice(start, end + 1);
}

export class ValidationError extends Error {
  constructor(
    message: string,
    readonly issues: string[],
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/** Valida la respuesta del LLM contra el contrato. Lanza ValidationError. */
export function validateGeneratedPost(raw: string): GeneratedPost {
  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJson(raw));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new ValidationError('La respuesta no es JSON válido', [message]);
  }

  const result = PostSchema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues.map(
      (issue) => `${issue.path.join('.') || '(raíz)'}: ${issue.message}`,
    );
    throw new ValidationError('El JSON no cumple el contrato de contenido', issues);
  }

  return result.data as GeneratedPost;
}

export function bodyWordCount(markdown: string): number {
  return markdown.split(/\s+/).filter(Boolean).length;
}

/**
 * Palabras normalizadas de un texto (para el control anti-copia).
 */
function words(text: string): string[] {
  return normalizeText(text).split(' ').filter(Boolean);
}

function ngrams(text: string, n: number): Set<string> {
  const tokens = words(text);
  const grams = new Set<string>();
  for (let i = 0; i + n <= tokens.length; i += 1) {
    grams.add(tokens.slice(i, i + n).join(' '));
  }
  return grams;
}

/**
 * Proporción de n-gramas del texto generado que también aparecen en el
 * original. 0 = nada copiado, 1 = todo copiado.
 */
export function ngramOverlap(generated: string, original: string, n = 8): number {
  if (!original.trim() || !generated.trim()) return 0;
  const generatedGrams = ngrams(generated, n);
  if (generatedGrams.size === 0) return 0;
  const originalGrams = ngrams(original, n);
  let shared = 0;
  for (const gram of generatedGrams) {
    if (originalGrams.has(gram)) shared += 1;
  }
  return shared / generatedGrams.size;
}

const SYSTEM_PROMPT = `Eres el redactor de High Doctor Foundation, una fundación europea sin ánimo de lucro que divulga ciencia sobre cannabis con rigor, sin sensacionalismo y sin promocionar el consumo.

Voz: divulgativa, rigurosa, cercana y sobria. Español e inglés naturales, sin calcos ni florituras. Hablas como una fundación, no como una marca ni como un medio de lifestyle.

Reglas obligatorias:
- Escribe 300-500 palabras por idioma en el campo "body" (markdown, sin H1: el título ya está en "title").
- Estructura del body, con estos cuatro bloques en este orden, usando ## como encabezado:
  1. "## Qué ha pasado" — el hecho, atribuido a la fuente.
  2. "## Por qué importa" — contexto y relevancia para pacientes, investigadores o política pública europea.
  3. "## Contexto" — antecedentes verificables y qué dice la evidencia disponible.
  4. "## Qué no sabemos todavía" — límites del estudio o de la información, cautelas.
- Cita la fuente dentro del texto: menciona el medio o la revista y enlaza la URL original en markdown una sola vez.
- No inventes datos, cifras, fechas, nombres ni citas. Si el original no lo dice, no lo escribas.
- Prohibido dar dosis, pautas de consumo ni consejos médicos. Prohibido recomendar probar, comprar o cultivar cannabis. Prohibido hablar de precios, cepas como producto o recetas.
- No copies: resumen y redacción propios. Nunca reproduzcas frases del original.
- Nada de sensacionalismo, mayúsculas gritadas ni emojis.

Devuelve EXCLUSIVAMENTE un objeto JSON válido, sin markdown alrededor, con esta forma exacta:
{
  "es": { "title": "...", "summary": "...", "body": "...", "instagramHook": "...", "tags": ["...", "..."] },
  "en": { "title": "...", "summary": "...", "body": "...", "instagramHook": "...", "tags": ["...", "..."] },
  "category": "investigacion | salud | legislacion | cultura"
}
Límites estrictos: title ≤ 90 caracteres, summary ≤ 200, instagramHook ≤ 80 (una frase gancho, sin hashtags). tags: entre 2 y 6 etiquetas cortas en minúsculas, sin #.
El campo "category" debe ser una de: ${CATEGORIES.join(', ')}.
Los dos idiomas deben contar lo mismo, no ser traducción literal palabra por palabra.`;

function buildUserPrompt(item: FeedItem, article: ExtractedArticle): string {
  const parts = [
    `Noticia a cubrir:`,
    `- Fuente: ${item.sourceName}`,
    `- Título original: ${item.title}`,
    `- URL: ${item.url}`,
    `- Fecha: ${item.publishedAt ? item.publishedAt.toISOString() : 'desconocida'}`,
    `- Resumen del feed: ${item.summary || '(sin resumen)'}`,
    `- Categoría sugerida: ${item.defaultCategory}`,
  ];

  if (article.text) {
    parts.push(
      '',
      'Texto del artículo (sólo como referencia factual; NO lo copies):',
      '"""',
      article.text,
      '"""',
    );
  } else {
    parts.push(
      '',
      `No se ha podido leer el artículo completo (${article.skippedReason ?? 'sin acceso'}). Escribe sólo con el título y el resumen; si no hay información suficiente, no inventes.`,
    );
  }

  return parts.join('\n');
}

function describeLengths(post: GeneratedPost): string[] {
  return (['es', 'en'] as const).map((lang) => {
    const count = bodyWordCount(post[lang].body);
    return `${lang}: ${count} palabras`;
  });
}

export interface GenerateOptions {
  item: FeedItem;
  article: ExtractedArticle;
  provider: Provider;
  config: BotConfig;
}

export interface GenerateResult {
  post: GeneratedPost;
  attempts: number;
  overlap: number;
  lengthByLang: string[];
  history: string[];
}

/**
 * Genera el post. Lanza un error si no se consigue un JSON válido o si el
 * texto sigue copiando el original después de reescribirlo.
 */
export async function generatePost({
  item,
  article,
  provider,
  config,
}: GenerateOptions): Promise<GenerateResult> {
  const history: string[] = [];
  let validationRetries = 0;
  let copyRewrites = 0;
  let attempt = 0;
  let feedback = '';

  while (attempt < 1 + config.llm.maxValidationRetries + 1) {
    attempt += 1;
    const raw = await provider.complete({
      system: SYSTEM_PROMPT,
      user: feedback ? `${buildUserPrompt(item, article)}\n\n${feedback}` : buildUserPrompt(item, article),
      temperature: config.llm.temperature,
    });

    let post: GeneratedPost;
    try {
      post = validateGeneratedPost(raw);
    } catch (error) {
      const issues = error instanceof ValidationError ? error.issues : [String(error)];
      history.push(`intento ${attempt}: JSON no válido (${issues.join(' | ')})`);
      if (validationRetries >= config.llm.maxValidationRetries) {
        throw new Error(
          `El LLM no devolvió un JSON válido tras ${attempt} intentos: ${issues.join(' | ')}`,
        );
      }
      validationRetries += 1;
      feedback = `Tu respuesta anterior no cumplía el contrato:\n- ${issues.join('\n- ')}\nCorrige esos puntos y devuelve sólo el JSON.`;
      continue;
    }

    const lengthByLang = describeLengths(post);
    const tooShort = (['es', 'en'] as const).filter(
      (lang) => bodyWordCount(post[lang].body) < config.llm.minWords,
    );
    const tooLong = (['es', 'en'] as const).filter(
      (lang) => bodyWordCount(post[lang].body) > config.llm.maxWords,
    );

    if (tooShort.length > 0 || tooLong.length > 0) {
      const problems = [
        tooShort.length > 0 ? `demasiado corto en ${tooShort.join('/')} (mínimo ${config.llm.minWords} palabras)` : '',
        tooLong.length > 0 ? `demasiado largo en ${tooLong.join('/')} (máximo ${config.llm.maxWords} palabras)` : '',
      ]
        .filter(Boolean)
        .join('; ');
      history.push(`intento ${attempt}: longitud fuera de rango (${lengthByLang.join(', ')})`);
      if (validationRetries >= config.llm.maxValidationRetries) {
        throw new Error(`El cuerpo no tiene la longitud pedida (${lengthByLang.join(', ')}).`);
      }
      validationRetries += 1;
      feedback = `Tu respuesta anterior tenía el cuerpo ${problems}. Ajusta la longitud y devuelve sólo el JSON.`;
      continue;
    }

    const overlap = Math.max(
      ngramOverlap(post.es.body, article.text, config.copyCheck.ngram),
      ngramOverlap(post.en.body, article.text, config.copyCheck.ngram),
    );

    if (overlap > config.copyCheck.maxOverlap) {
      history.push(
        `intento ${attempt}: ${(overlap * 100).toFixed(1)} % de ${config.copyCheck.ngram}-gramas copiados`,
      );
      if (copyRewrites >= 1) {
        throw new Error(
          `Texto descartado: el ${(overlap * 100).toFixed(1)} % de ${config.copyCheck.ngram}-gramas coincide con el original (máximo ${(config.copyCheck.maxOverlap * 100).toFixed(0)} %).`,
        );
      }
      copyRewrites += 1;
      feedback = `Tu versión anterior copiaba frases del original (${(overlap * 100).toFixed(1)} % de ${config.copyCheck.ngram}-gramas en común). Reescribe con palabras propias, cambia el orden y las estructuras, y no repitas secuencias de más de 6 palabras del original. Devuelve sólo el JSON.`;
      continue;
    }

    return { post, attempts: attempt, overlap, lengthByLang, history };
  }

  throw new Error(`Sin respuesta válida del LLM tras ${attempt} intentos: ${history.join(' | ')}`);
}
