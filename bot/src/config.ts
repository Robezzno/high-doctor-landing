/**
 * Carga de bot/config.yml, bot/sources.yml y bot/state/seen.json.
 * Rutas relativas a la raíz del repo para que el bot funcione igual en local
 * (desde bot/ o desde la raíz) y en GitHub Actions.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import { CATEGORIES, type BotConfig, type SeenState, type Source } from './types.js';

export const BOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const REPO_ROOT = path.resolve(BOT_DIR, '..');

export function readYaml<T>(file: string): T {
  return parseYaml(readFileSync(file, 'utf8')) as T;
}

/** `true` sólo si la variable vale exactamente "1" o "true". */
export function envFlag(name: string): boolean {
  const raw = (process.env[name] ?? '').trim().toLowerCase();
  return raw === '1' || raw === 'true';
}

export function loadSources(file = path.join(BOT_DIR, 'sources.yml')): Source[] {
  const doc = readYaml<{ sources?: unknown[] }>(file);
  const list = (doc.sources ?? []) as Source[];
  if (list.length === 0) throw new Error(`sources.yml sin fuentes: ${file}`);

  const ids = new Set<string>();
  for (const source of list) {
    for (const field of ['id', 'name', 'url', 'type', 'weight', 'category'] as const) {
      if (source[field] === undefined || source[field] === null || source[field] === '') {
        throw new Error(`Fuente sin "${field}" en sources.yml: ${JSON.stringify(source)}`);
      }
    }
    if (source.type !== 'rss' && source.type !== 'pubmed') {
      throw new Error(`Tipo de fuente desconocido "${source.type}" en ${source.id}`);
    }
    if (!CATEGORIES.includes(source.category)) {
      throw new Error(`Categoría "${source.category}" no válida en la fuente ${source.id}`);
    }
    if (ids.has(source.id)) throw new Error(`Id de fuente repetido: ${source.id}`);
    ids.add(source.id);
  }
  return list;
}

export function loadConfig(file = path.join(BOT_DIR, 'config.yml')): BotConfig {
  const raw = readYaml<Record<string, any>>(file);

  const mode = (process.env.BOT_MODE?.trim() || raw.mode || 'review') as BotConfig['mode'];
  if (mode !== 'review' && mode !== 'publish') {
    throw new Error(`BOT_MODE no válido: "${mode}" (usa review o publish)`);
  }

  const provider = (process.env.LLM_PROVIDER?.trim() || raw.llm?.provider) as BotConfig['llm']['provider'];
  if (provider !== 'github-models' && provider !== 'anthropic') {
    throw new Error(`LLM_PROVIDER no válido: "${provider}" (github-models o anthropic)`);
  }

  const keywords: BotConfig['keywords'] = {};
  for (const [group, rules] of Object.entries(raw.keywords ?? {})) {
    keywords[group] = ((rules ?? []) as any[]).map((rule) => ({
      pattern: String(rule.pattern).trim(),
      weight: Number(rule.weight ?? 1),
    }));
  }

  return {
    mode,
    maxAgeHours: Number(raw.max_age_hours ?? 72),
    titleSimilarityThreshold: Number(raw.title_similarity_threshold ?? 0.6),
    maxPerRun: Number(raw.max_per_run ?? 1),
    minScore: Number(raw.min_score ?? 3),
    keywords,
    vetos: ((raw.vetos ?? []) as any[]).map((veto) => ({
      id: String(veto.id),
      label: String(veto.label ?? veto.id),
      patterns: ((veto.patterns ?? []) as string[]).map((p) => String(p)),
    })),
    copyCheck: {
      ngram: Number(raw.copy_check?.ngram ?? 8),
      maxOverlap: Number(raw.copy_check?.max_overlap ?? 0.15),
    },
    llm: {
      provider,
      model: process.env.LLM_MODEL?.trim() || String(raw.llm?.model ?? 'openai/gpt-4o-mini'),
      temperature: Number(raw.llm?.temperature ?? 0.4),
      minWords: Number(raw.llm?.min_words ?? 300),
      maxWords: Number(raw.llm?.max_words ?? 500),
      timeoutMs: Number(raw.llm?.timeout_ms ?? 120000),
      maxValidationRetries: Number(raw.llm?.max_validation_retries ?? 1),
    },
    output: {
      contentDir: String(raw.output?.content_dir ?? 'src/content/news'),
      stateFile: String(raw.output?.state_file ?? 'bot/state/seen.json'),
      instagram: (raw.output?.instagram ?? 'pending') as BotConfig['output']['instagram'],
      author: String(raw.output?.author ?? 'bot'),
      prLabel: String(raw.output?.pr_label ?? 'noticia-bot'),
      prBranchPrefix: String(raw.output?.pr_branch_prefix ?? 'noticia-bot/'),
      commitAuthor: {
        name: String(raw.output?.commit_author?.name ?? 'Robezzno'),
        email: String(raw.output?.commit_author?.email ?? 'robezzno@gmail.com'),
      },
    },
  };
}

/** Directorio de posts del contrato de contenido, absoluto. */
export function contentDir(config: BotConfig): string {
  return path.resolve(REPO_ROOT, config.output.contentDir);
}

/** Fichero de estado, absoluto. */
export function stateFile(config: BotConfig): string {
  return path.resolve(REPO_ROOT, config.output.stateFile);
}

export function readSeen(file: string): SeenState {
  const raw = JSON.parse(readFileSync(file, 'utf8')) as Partial<SeenState>;
  return {
    version: Number(raw.version ?? 1),
    updatedAt: raw.updatedAt ?? null,
    seen: Array.isArray(raw.seen) ? raw.seen : [],
  };
}
