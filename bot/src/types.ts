/**
 * Tipos compartidos del bot de noticias.
 * El contrato de contenido (categorías, límites de longitud) vive en
 * docs/CONTENIDO.md y se valida con Zod en src/write.ts.
 */

/** Categorías permitidas por el contrato de contenido. */
export const CATEGORIES = [
  'investigacion',
  'salud',
  'legislacion',
  'cultura',
  'fundacion',
  'eventos',
] as const;

export type Category = (typeof CATEGORIES)[number];

export type SourceType = 'rss' | 'pubmed';

/** Una fuente de bot/sources.yml. */
export interface Source {
  id: string;
  name: string;
  url: string;
  type: SourceType;
  weight: number;
  category: Category;
  lang?: string;
  /** Sólo PubMed: término de búsqueda. */
  query?: string;
  /** Sólo PubMed: número máximo de resultados. */
  retmax?: number;
}

/** Una noticia normalizada, ya sin formato de feed. */
export interface FeedItem {
  sourceId: string;
  sourceName: string;
  sourceWeight: number;
  defaultCategory: Category;
  sourceLang: string;
  title: string;
  /** URL tal cual viene en el feed. */
  url: string;
  /** URL normalizada (sin tracking) que se usa para deduplicar. */
  canonicalUrl: string;
  /** Fecha de publicación; null si el feed no la trae o no es válida. */
  publishedAt: Date | null;
  /** Resumen del feed (puede venir con HTML). */
  summary: string;
  /** Contenido del feed si lo trae (content:encoded), sin usar aún. */
  content?: string;
}

/** Entrada de bot/state/seen.json (idempotencia). */
export interface SeenEntry {
  url: string;
  title: string;
  seenAt: string;
  sourceId: string;
}

export interface SeenState {
  version: number;
  updatedAt: string | null;
  seen: SeenEntry[];
}

/** Palabra clave con peso para puntuar la relevancia. */
export interface KeywordRule {
  pattern: string;
  weight: number;
}

/** Tema vetado. */
export interface VetoRule {
  id: string;
  label: string;
  patterns: string[];
}

export interface BotConfig {
  mode: 'publish' | 'review';
  maxAgeHours: number;
  titleSimilarityThreshold: number;
  maxPerRun: number;
  minScore: number;
  keywords: Record<string, KeywordRule[]>;
  vetos: VetoRule[];
  copyCheck: { ngram: number; maxOverlap: number };
  llm: {
    provider: 'github-models' | 'anthropic';
    model: string;
    temperature: number;
    minWords: number;
    maxWords: number;
    timeoutMs: number;
    maxValidationRetries: number;
  };
  output: {
    contentDir: string;
    stateFile: string;
    instagram: 'off' | 'pending' | 'published';
    author: string;
    prLabel: string;
    prBranchPrefix: string;
    commitAuthor: { name: string; email: string };
  };
}

/** Contenido de un idioma tal y como lo devuelve el LLM. */
export interface LocalizedPost {
  title: string;
  summary: string;
  body: string;
  instagramHook: string;
  tags: string[];
}

/** JSON completo que devuelve el LLM. */
export interface GeneratedPost {
  es: LocalizedPost;
  en: LocalizedPost;
  category: Category;
}

/** Artículo extraído con Readability. */
export interface ExtractedArticle {
  url: string;
  title: string;
  text: string;
  /** Motivo por el que no se pudo extraer, si aplica. */
  skippedReason?: string;
}
