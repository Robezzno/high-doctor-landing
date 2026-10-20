/**
 * Publicación automática del reclamo en Instagram (prompt 08).
 *
 * Flujo:
 *   posts con `instagram: 'pending'`  →  esperar la tarjeta en línea
 *   →  POST /<IG_USER_ID>/media (image_url + caption)  →  esperar status_code
 *   →  POST /<IG_USER_ID>/media_publish  →  `instagram: 'published'` + `instagramId`
 *
 * Decisiones que están en el código y no se negocian:
 * - API oficial **Instagram API with Instagram Login** (graph.instagram.com),
 *   permiso `instagram_business_content_publish`. Nada de `instagrapi`.
 * - Un post con versión ES y EN se publica UNA sola vez (por `translationKey`),
 *   en el idioma que diga `IG_LANG` (ES por defecto).
 * - Si falla, el post sigue en `pending`. Tras 3 fallos seguidos del mismo post
 *   pasa a `'off'` para no entrar en un bucle: alguien tiene que mirarlo.
 * - Commits con autoría de persona (`Robezzno <robezzno@gmail.com>`), sin
 *   atribución a IA.
 *
 * El código de red y el de git se inyectan en `runInstagram()` para poder
 * probar el flujo entero con vitest, sin llamar a Meta ni escribir commits.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import { buildCaption, loadHashtags, type HashtagConfig } from './caption.js';
import { REPO_ROOT, envFlag, loadConfig } from './config.js';

export const SITE_URL = 'https://highdoctor.foundation';
export const GRAPH_HOST = 'https://graph.instagram.com';

/** Versión de la API de Instagram. Consultada el 2026-10-20 en la documentación de Meta. */
export const DEFAULT_API_VERSION = 'v26.0';

/** Cuánto se espera a que el CDN de Pages sirva la tarjeta (5 min). */
export const IMAGE_WAIT_MS = 5 * 60 * 1000;

/** Cuánto se espera a que el contenedor pase a FINISHED (5 min, como recomienda Meta). */
export const CONTAINER_WAIT_MS = 5 * 60 * 1000;

/** Fallos seguidos del mismo post antes de pasar a `instagram: 'off'`. */
export const MAX_FAILURES = 3;

export type PostLang = 'es' | 'en';
export const POST_LANGS: PostLang[] = ['es', 'en'];

/** URL pública de la tarjeta social que genera el build (`src/pages/social/...`). */
export function socialImageUrl(lang: PostLang | string, slug: string, baseUrl = SITE_URL): string {
  return `${baseUrl.replace(/\/$/, '')}/social/${lang}/${slug}.jpg`;
}

export interface PostVersion {
  lang: PostLang;
  slug: string;
  /** Ruta absoluta del .md. */
  path: string;
  /** Ruta relativa a la raíz del repo (para `git add`). */
  relPath: string;
  /** Frontmatter ya parseado. */
  data: Record<string, unknown>;
  /** Contenido completo del fichero, tal cual. */
  raw: string;
}

export interface FrontmatterSplit {
  data: Record<string, unknown>;
  body: string;
}

/** Separa frontmatter y cuerpo de un .md del contrato de contenido. */
export function parseFrontmatter(raw: string): FrontmatterSplit | null {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return null;
  let data: Record<string, unknown>;
  try {
    data = (parseYaml(match[1]) ?? {}) as Record<string, unknown>;
  } catch {
    return null;
  }
  if (!data || typeof data !== 'object') return null;
  return { data, body: raw.slice(match[0].length) };
}

/** Lee todas las versiones de idioma del blog (`src/content/news/<lang>/*.md`). */
export function readPostVersions(contentDirAbs: string, repoRoot = REPO_ROOT): PostVersion[] {
  const versions: PostVersion[] = [];
  for (const lang of POST_LANGS) {
    const dir = path.join(contentDirAbs, lang);
    if (!existsSync(dir)) continue;
    for (const file of readdirSync(dir).sort()) {
      if (!file.endsWith('.md')) continue;
      const absolute = path.join(dir, file);
      const raw = readFileSync(absolute, 'utf8');
      const split = parseFrontmatter(raw);
      if (!split) continue;
      versions.push({
        lang,
        slug: file.replace(/\.md$/, ''),
        path: absolute,
        relPath: path.relative(repoRoot, absolute),
        data: split.data,
        raw,
      });
    }
  }
  return versions;
}

/** Fecha del frontmatter, sea `AAAA-MM-DD` o un ISO completo. */
export function parsePostDate(value: unknown): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const date = new Date(String(value).trim());
  return Number.isNaN(date.getTime()) ? null : date;
}

export interface SelectedPost {
  translationKey: string;
  /** Idioma que se publica. */
  lang: PostLang;
  slug: string;
  title: string;
  summary: string;
  hook: string;
  category: string;
  author: string;
  sourceName: string;
  date: string;
  imageUrl: string;
  /** Todas las versiones de idioma del mismo post (ES y EN). */
  versions: PostVersion[];
}

export interface SkippedPost {
  relPath: string;
  reason: string;
}

export interface SelectionOptions {
  now: Date;
  /** Idioma preferido; si el post no lo tiene, se usa el que haya. */
  lang?: PostLang;
  /** Cuántos posts se publican en esta ejecución (1 por defecto). */
  maxPerRun?: number;
}

export interface SelectionResult {
  selected: SelectedPost[];
  skipped: SkippedPost[];
  /** Posts que siguen en cola después de los elegidos. */
  pendingRemaining: number;
}

export function instagramFlag(data: Record<string, unknown>): string {
  return String(data.instagram ?? 'pending')
    .trim()
    .toLowerCase();
}

/**
 * Elige qué se publica: `instagram: 'pending'`, `draft: false` y fecha ≤ ahora.
 * Agrupa por `translationKey` para no publicar dos veces el mismo post y se
 * queda con la versión del idioma preferido (`IG_LANG`).
 */
export function selectPendingPosts(versions: PostVersion[], options: SelectionOptions): SelectionResult {
  const lang: PostLang = options.lang === 'en' ? 'en' : 'es';
  const maxPerRun = Math.max(1, options.maxPerRun ?? 1);
  const skipped: SkippedPost[] = [];
  const groups = new Map<string, PostVersion[]>();

  for (const version of versions) {
    const flag = instagramFlag(version.data);
    if (flag === 'off') {
      skipped.push({ relPath: version.relPath, reason: 'instagram: off' });
      continue;
    }
    if (flag === 'published') {
      skipped.push({ relPath: version.relPath, reason: 'ya publicado en Instagram' });
      continue;
    }
    if (flag !== 'pending') {
      skipped.push({ relPath: version.relPath, reason: `instagram: "${flag}" no es un valor válido` });
      continue;
    }
    if (version.data.draft === true) {
      skipped.push({ relPath: version.relPath, reason: 'borrador (draft: true)' });
      continue;
    }
    const date = parsePostDate(version.data.date);
    if (!date) {
      skipped.push({ relPath: version.relPath, reason: 'sin fecha válida' });
      continue;
    }
    if (date.getTime() > options.now.getTime()) {
      skipped.push({
        relPath: version.relPath,
        reason: `programado para el futuro (${date.toISOString().slice(0, 10)})`,
      });
      continue;
    }
    const key = String(version.data.translationKey ?? version.slug).trim() || version.slug;
    const group = groups.get(key) ?? [];
    group.push(version);
    groups.set(key, group);
  }

  const ordered = [...groups.entries()]
    .map(([key, group]) => ({
      key,
      group,
      date: Math.min(...group.map((version) => (parsePostDate(version.data.date) as Date).getTime())),
    }))
    .sort((a, b) => (a.date === b.date ? a.key.localeCompare(b.key) : a.date - b.date));

  const selected: SelectedPost[] = [];
  for (const { key, group } of ordered) {
    if (selected.length >= maxPerRun) {
      for (const version of group) {
        skipped.push({ relPath: version.relPath, reason: 'en cola: se publica en la siguiente ejecución' });
      }
      continue;
    }

    const chosen =
      group.find((version) => version.lang === lang) ??
      group.find((version) => version.lang === 'es') ??
      (group[0] as PostVersion);

    for (const version of group) {
      if (version === chosen) continue;
      skipped.push({
        relPath: version.relPath,
        reason: `mismo post: se publica la versión ${chosen.lang}`,
      });
    }

    selected.push({
      translationKey: key,
      lang: chosen.lang,
      slug: chosen.slug,
      title: String(chosen.data.title ?? '').trim(),
      summary: String(chosen.data.summary ?? '').trim(),
      hook: String(chosen.data.instagramHook ?? '').trim(),
      category: String(chosen.data.category ?? '').trim(),
      author: String(chosen.data.author ?? '').trim(),
      sourceName: String((chosen.data.source as { name?: unknown } | undefined)?.name ?? '').trim(),
      date: (parsePostDate(chosen.data.date) as Date).toISOString(),
      imageUrl: socialImageUrl(chosen.lang, chosen.slug),
      versions: group,
    });
  }

  return { selected, skipped, pendingRemaining: ordered.length - selected.length };
}

export interface InstagramStateEntry {
  count: number;
  lastError: string;
  lastAttemptAt: string;
}

export interface InstagramState {
  version: number;
  updatedAt: string | null;
  failures: Record<string, InstagramStateEntry>;
}

export function emptyInstagramState(): InstagramState {
  return { version: 1, updatedAt: null, failures: {} };
}

export function readInstagramState(file: string): InstagramState {
  if (!existsSync(file)) return emptyInstagramState();
  try {
    const raw = JSON.parse(readFileSync(file, 'utf8')) as Partial<InstagramState>;
    return {
      version: Number(raw.version ?? 1),
      updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : null,
      failures: (raw.failures ?? {}) as Record<string, InstagramStateEntry>,
    };
  } catch {
    // Un estado ilegible no debe tumbar el flujo: se empieza de cero.
    return emptyInstagramState();
  }
}

export function writeInstagramState(file: string, state: InstagramState): void {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
}

/** Suma un fallo al post. Devuelve el estado nuevo y si hay que desactivarlo. */
export function recordFailure(
  state: InstagramState,
  translationKey: string,
  error: string,
  now: Date,
  maxFailures = MAX_FAILURES,
): { state: InstagramState; giveUp: boolean; count: number } {
  const previous = state.failures[translationKey];
  const count = (previous?.count ?? 0) + 1;
  return {
    state: {
      version: state.version || 1,
      updatedAt: now.toISOString(),
      failures: {
        ...state.failures,
        [translationKey]: { count, lastError: error, lastAttemptAt: now.toISOString() },
      },
    },
    giveUp: count >= maxFailures,
    count,
  };
}

/** Borra el contador de fallos de un post que ya se ha publicado. */
export function clearFailure(state: InstagramState, translationKey: string, now: Date): InstagramState {
  const failures = { ...state.failures };
  delete failures[translationKey];
  return { version: state.version || 1, updatedAt: now.toISOString(), failures };
}

/**
 * Escribe `instagram` (y opcionalmente `instagramId`) en el frontmatter sin
 * tocar el resto del fichero: se cambian las líneas de esas claves y, si no
 * existen, se añaden al final del frontmatter.
 */
export function setInstagramFields(
  raw: string,
  fields: { instagram: 'published' | 'off'; instagramId?: string },
): string {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) throw new Error('El post no tiene frontmatter');

  const lines = match[1].split('\n');
  const setField = (key: string, value: string): void => {
    const regex = new RegExp(`^${key}\\s*:`);
    const index = lines.findIndex((line) => regex.test(line));
    const formatted = `${key}: '${value.replace(/'/g, "''")}'`;
    if (index >= 0) {
      lines[index] = formatted;
      return;
    }
    const anchor = lines.findIndex((line) => /^instagram\s*:/.test(line));
    lines.splice(anchor >= 0 ? anchor + 1 : lines.length, 0, formatted);
  };

  setField('instagram', fields.instagram);
  if (fields.instagramId !== undefined) setField('instagramId', fields.instagramId);

  const rest = raw.slice(match[0].length);
  return `---\n${lines.join('\n')}\n---${rest.startsWith('\n') ? rest : `\n${rest}`}`;
}

// --- API de Instagram --------------------------------------------------------

export interface PublishingLimit {
  used: number;
  total: number;
}

/**
 * Lo que el flujo necesita de Meta. Se inyecta en `runInstagram()` para que los
 * tests no hagan red.
 */
export interface InstagramApi {
  imageAvailable(url: string): Promise<boolean>;
  publishingLimit(): Promise<PublishingLimit | null>;
  createContainer(input: { imageUrl: string; caption: string }): Promise<string>;
  containerStatus(containerId: string): Promise<string>;
  publishContainer(containerId: string): Promise<string>;
}

export interface InstagramApiOptions {
  accessToken: string;
  userId: string;
  version?: string;
}

/** Cliente real contra graph.instagram.com (Instagram API with Instagram Login). */
export function createInstagramApi({
  accessToken,
  userId,
  version = DEFAULT_API_VERSION,
}: InstagramApiOptions): InstagramApi {
  const base = `${GRAPH_HOST}/${version}`;

  const request = async (url: string, init: RequestInit = {}): Promise<Response> => {
    const response = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...(init.headers ?? {}),
      },
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`Instagram ${response.status}: ${detail.slice(0, 400)}`);
    }
    return response;
  };

  return {
    async imageAvailable(url: string): Promise<boolean> {
      try {
        const head = await fetch(url, { method: 'HEAD', redirect: 'follow' });
        if (head.ok) return true;
        // Algunos CDN no responden a HEAD: se prueba un GET normal.
        if (head.status === 405 || head.status === 403 || head.status === 501) {
          const get = await fetch(url, { method: 'GET', redirect: 'follow' });
          return get.ok;
        }
        return false;
      } catch {
        return false;
      }
    },

    async publishingLimit(): Promise<PublishingLimit | null> {
      const response = await request(
        `${base}/${userId}/content_publishing_limit?fields=quota_usage,config`,
      );
      const payload = (await response.json()) as {
        data?: Array<{ quota_usage?: number; config?: { quota_total?: number } }>;
      };
      const entry = payload.data?.[0];
      if (!entry) return null;
      return {
        used: Number(entry.quota_usage ?? 0),
        total: Number(entry.config?.quota_total ?? 100),
      };
    },

    async createContainer({ imageUrl, caption }): Promise<string> {
      const response = await request(`${base}/${userId}/media`, {
        method: 'POST',
        body: JSON.stringify({ image_url: imageUrl, caption }),
      });
      const payload = (await response.json()) as { id?: string };
      if (!payload.id) throw new Error('Instagram no devolvió el id del contenedor');
      return payload.id;
    },

    async containerStatus(containerId: string): Promise<string> {
      const response = await request(`${base}/${containerId}?fields=status_code`);
      const payload = (await response.json()) as { status_code?: string };
      return String(payload.status_code ?? 'UNKNOWN');
    },

    async publishContainer(containerId: string): Promise<string> {
      const response = await request(`${base}/${userId}/media_publish`, {
        method: 'POST',
        body: JSON.stringify({ creation_id: containerId }),
      });
      const payload = (await response.json()) as { id?: string };
      if (!payload.id) throw new Error('Instagram no devolvió el id del post publicado');
      return payload.id;
    },
  };
}

export interface WaitOptions {
  probe: () => Promise<boolean>;
  maxWaitMs?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  sleep?: (ms: number) => Promise<void>;
}

export interface WaitResult {
  ok: boolean;
  attempts: number;
  waitedMs: number;
}

const realSleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Reintenta `probe()` con backoff exponencial (2 s, 4 s, 8 s… hasta 30 s) sin
 * pasar de `maxWaitMs`. El CDN de GitHub Pages tarda en servir la tarjeta
 * recién generada.
 */
export async function waitUntil({
  probe,
  maxWaitMs = IMAGE_WAIT_MS,
  initialDelayMs = 2000,
  maxDelayMs = 30000,
  sleep = realSleep,
}: WaitOptions): Promise<WaitResult> {
  let waitedMs = 0;
  let delay = initialDelayMs;
  let attempts = 0;

  // Primer intento inmediato: si la imagen ya está, no se espera nada.
  for (;;) {
    attempts += 1;
    if (await probe()) return { ok: true, attempts, waitedMs };
    if (waitedMs + delay > maxWaitMs) return { ok: false, attempts, waitedMs };
    await sleep(delay);
    waitedMs += delay;
    delay = Math.min(Math.round(delay * 2), maxDelayMs);
  }
}

/** Espera a que el contenedor esté listo (`FINISHED`) para publicarlo. */
export async function waitForContainer(
  api: Pick<InstagramApi, 'containerStatus'>,
  containerId: string,
  options: { maxWaitMs?: number; intervalMs?: number; sleep?: (ms: number) => Promise<void> } = {},
): Promise<void> {
  const maxWaitMs = options.maxWaitMs ?? CONTAINER_WAIT_MS;
  const intervalMs = options.intervalMs ?? 10000;
  const sleep = options.sleep ?? realSleep;

  let waitedMs = 0;
  for (;;) {
    const status = await api.containerStatus(containerId);
    if (status === 'FINISHED' || status === 'PUBLISHED') return;
    if (status === 'ERROR' || status === 'EXPIRED') {
      throw new Error(`el contenedor de Instagram terminó en estado ${status}`);
    }
    if (waitedMs + intervalMs > maxWaitMs) {
      throw new Error(`el contenedor de Instagram no llegó a FINISHED en ${Math.round(maxWaitMs / 1000)} s`);
    }
    await sleep(intervalMs);
    waitedMs += intervalMs;
  }
}

// --- Orquestación ------------------------------------------------------------

export interface RunInstagramOptions {
  repoRoot: string;
  contentDirAbs: string;
  stateFileAbs: string;
  now: Date;
  /** Idioma del caption y de la tarjeta (`IG_LANG`). */
  lang?: PostLang;
  maxPerRun?: number;
  dryRun: boolean;
  /** `null` en dry run: no se llama a Meta. */
  api?: InstagramApi | null;
  /** Configuración de hashtags (los tests la inyectan). */
  hashtags?: HashtagConfig;
  /** `git add` + `git commit` + push. Se inyecta para no tocar git en los tests. */
  commit?: (paths: string[], message: string) => void;
  log?: (line: string) => void;
  /** Cómo se comprueba que la tarjeta está en línea. */
  imageAvailable?: (url: string) => Promise<boolean>;
  /** Cómo se espera al contenedor. */
  containerWaiter?: (containerId: string) => Promise<void>;
  sleep?: (ms: number) => Promise<void>;
}

export interface PublishedPost {
  translationKey: string;
  lang: PostLang;
  slug: string;
  instagramId: string;
  caption: string;
  imageUrl: string;
}

export interface FailedPost {
  translationKey: string;
  error: string;
  failures: number;
  /** `true` si se ha llegado a 3 fallos y el post queda en `instagram: 'off'`. */
  disabled: boolean;
}

export interface RunInstagramResult {
  selected: number;
  published: PublishedPost[];
  previews: Array<{ translationKey: string; lang: PostLang; slug: string; caption: string; imageUrl: string }>;
  failed: FailedPost[];
  skipped: SkippedPost[];
  pendingRemaining: number;
  quotaExhausted: boolean;
}

/**
 * Ejecuta el flujo completo. Es idempotente: lo publicado se marca como
 * `published` en todas las versiones de idioma en el mismo commit.
 */
export async function runInstagram(options: RunInstagramOptions): Promise<RunInstagramResult> {
  const log = options.log ?? (() => {});
  const hashtags = options.hashtags ?? loadHashtags();
  const lang: PostLang = options.lang === 'en' ? 'en' : 'es';
  const now = options.now;

  const versions = readPostVersions(options.contentDirAbs, options.repoRoot);
  const selection = selectPendingPosts(versions, { now, lang, maxPerRun: options.maxPerRun });

  const result: RunInstagramResult = {
    selected: selection.selected.length,
    published: [],
    previews: [],
    failed: [],
    skipped: selection.skipped,
    pendingRemaining: selection.pendingRemaining,
    quotaExhausted: false,
  };

  if (selection.selected.length === 0) {
    log('Sin posts con `instagram: pending`: no hay nada que publicar.');
    return result;
  }

  if (!options.dryRun && !options.api) throw new Error('falta el cliente de Instagram (api) para publicar de verdad');

  const stateFileRel = path.relative(options.repoRoot, options.stateFileAbs);
  let state = readInstagramState(options.stateFileAbs);

  const commit =
    options.commit ??
    (() => {
      throw new Error('falta la función commit para publicar de verdad');
    });

  let limit: PublishingLimit | null = null;
  if (!options.dryRun && options.api) {
    try {
      limit = await options.api.publishingLimit();
      if (limit) log(`Límite de publicación: ${limit.used}/${limit.total} en las últimas 24 h.`);
    } catch (error) {
      // Si el límite no se puede consultar, se publica igual: no es un motivo
      // para perder la noticia. Meta rechazará el POST si de verdad no queda cupo.
      log(`⚠️ No se pudo consultar content_publishing_limit: ${errorMessage(error)}`);
    }
  }

  for (const post of selection.selected) {
    const caption = buildCaption({
      title: post.title,
      summary: post.summary,
      hook: post.hook,
      author: post.author,
      sourceName: post.sourceName,
      category: post.category,
      lang,
      hashtags,
    });

    result.previews.push({
      translationKey: post.translationKey,
      lang: post.lang,
      slug: post.slug,
      caption,
      imageUrl: post.imageUrl,
    });

    if (options.dryRun) {
      log(`[dry run] ${post.lang}/${post.slug}`);
      log(`[dry run] imagen: ${post.imageUrl}`);
      log('');
      log(caption);
      log('');
      continue;
    }

    if (limit && limit.used >= limit.total) {
      result.quotaExhausted = true;
      log(`⚠️ Sin cupo de publicación en Instagram (${limit.used}/${limit.total}). Se deja para mañana.`);
      break;
    }

    const api = options.api as InstagramApi;
    const imageAvailable = options.imageAvailable ?? ((url: string) => api.imageAvailable(url));

    try {
      const ready = await waitUntil({
        probe: () => imageAvailable(post.imageUrl),
        maxWaitMs: IMAGE_WAIT_MS,
        sleep: options.sleep,
      });
      if (!ready.ok) {
        throw new Error(`la imagen no está en línea después de ${Math.round(IMAGE_WAIT_MS / 60000)} min: ${post.imageUrl}`);
      }
      log(`Imagen en línea (${ready.attempts} intento(s)): ${post.imageUrl}`);

      const containerId = await api.createContainer({ imageUrl: post.imageUrl, caption });
      log(`Contenedor creado: ${containerId}`);

      const waitForIt = options.containerWaiter ?? ((id: string) => waitForContainer(api, id));
      await waitForIt(containerId);
      log('Contenedor listo (FINISHED).');

      const instagramId = await api.publishContainer(containerId);
      log(`Publicado en Instagram: ${instagramId}`);

      const changedPaths: string[] = [];
      for (const version of post.versions) {
        const next = setInstagramFields(version.raw, { instagram: 'published', instagramId });
        if (next !== version.raw) {
          writeFileSync(version.path, next, 'utf8');
          changedPaths.push(version.relPath);
        }
      }

      state = clearFailure(state, post.translationKey, now);
      writeInstagramState(options.stateFileAbs, state);

      commit([...changedPaths, stateFileRel], `instagram: publicado "${post.title}"`);
      log(`Commit: instagram: publicado "${post.title}"`);

      if (limit) limit = { ...limit, used: limit.used + 1 };
      result.published.push({
        translationKey: post.translationKey,
        lang: post.lang,
        slug: post.slug,
        instagramId,
        caption,
        imageUrl: post.imageUrl,
      });
    } catch (error) {
      const message = errorMessage(error);
      const failure = recordFailure(state, post.translationKey, message, now);
      state = failure.state;
      log(`❌ ${post.translationKey}: ${message} (fallo ${failure.count}/${MAX_FAILURES})`);

      const changedPaths: string[] = [];
      if (failure.giveUp) {
        for (const version of post.versions) {
          const next = setInstagramFields(version.raw, { instagram: 'off' });
          if (next !== version.raw) {
            writeFileSync(version.path, next, 'utf8');
            changedPaths.push(version.relPath);
          }
        }
        log(`⛔ ${post.translationKey} pasa a instagram: 'off' tras ${failure.count} fallos.`);
      }
      writeInstagramState(options.stateFileAbs, state);

      const commitMessage = failure.giveUp
        ? `instagram: desactivado "${post.title}"`
        : `instagram: fallo al publicar "${post.title}"`;
      commit([...changedPaths, stateFileRel], commitMessage);

      result.failed.push({
        translationKey: post.translationKey,
        error: message,
        failures: failure.count,
        disabled: failure.giveUp,
      });
    }
  }

  return result;
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

// --- Entrada de línea de comandos -------------------------------------------

function summary(line = ''): void {
  console.log(line);
  const target = process.env.GITHUB_STEP_SUMMARY;
  if (target) {
    try {
      writeFileSync(target, `${line}\n`, { encoding: 'utf8', flag: 'a' });
    } catch {
      // El summary es opcional.
    }
  }
}

/** `git add` + commit (autor persona) + push a main. Nunca lo llama un test. */
export function commitInstagramChanges(repoRoot: string, paths: string[], message: string): void {
  const config = loadConfig();
  const author = config.output.commitAuthor;
  const git = (args: string[]) =>
    execFileSync(
      'git',
      ['-c', `user.name=${author.name}`, '-c', `user.email=${author.email}`, ...args],
      { cwd: repoRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    );
  git(['add', ...paths]);
  git(['commit', '-m', message]);
  git(['push', 'origin', 'HEAD:main']);
}

function sanitizeLang(raw: string | undefined): PostLang {
  return String(raw ?? 'es').trim().toLowerCase() === 'en' ? 'en' : 'es';
}

async function main(): Promise<number> {
  const dryRun = envFlag('DRY_RUN');
  const enabled = String(process.env.IG_ENABLED ?? 'true').trim().toLowerCase() !== 'false';
  const config = loadConfig();

  summary('# Reclamo en Instagram');
  summary('');
  summary(`Fecha: ${new Date().toISOString()}${dryRun ? ' · **dry run: no se publica nada**' : ''}`);

  if (!enabled) {
    summary('');
    summary('Instagram está desactivado (`IG_ENABLED=false`): no se hace nada.');
    return 0;
  }

  const accessToken = String(process.env.IG_ACCESS_TOKEN ?? '').trim();
  const userId = String(process.env.IG_USER_ID ?? '').trim();
  const lang = sanitizeLang(process.env.IG_LANG);
  const maxPerRun = Number(process.env.IG_MAX_PER_RUN ?? 1) || 1;

  if (!dryRun && (!accessToken || !userId)) {
    summary('');
    summary('**❌ Faltan `IG_ACCESS_TOKEN` o `IG_USER_ID`: no se puede publicar.**');
    summary('Pasos en `docs/INSTAGRAM-SETUP.md`.');
    return 1;
  }

  const api = dryRun
    ? null
    : createInstagramApi({
        accessToken,
        userId,
        version: String(process.env.IG_API_VERSION ?? DEFAULT_API_VERSION),
      });

  summary(`Idioma: **${lang}** · máximo por ejecución: ${maxPerRun}`);
  summary('');

  const result = await runInstagram({
    repoRoot: REPO_ROOT,
    contentDirAbs: path.resolve(REPO_ROOT, config.output.contentDir),
    stateFileAbs: path.resolve(REPO_ROOT, 'bot/state/instagram.json'),
    now: new Date(),
    lang,
    maxPerRun,
    dryRun,
    api,
    commit: (paths, message) => commitInstagramChanges(REPO_ROOT, paths, message),
    log: (line) => summary(line),
  });

  summary('');
  summary(`Posts en cola: ${result.selected} · publicados: ${result.published.length} · fallos: ${result.failed.length}`);
  if (result.pendingRemaining > 0) summary(`Quedan ${result.pendingRemaining} post(s) para la siguiente ejecución.`);
  if (result.quotaExhausted) summary('⚠️ Se ha agotado el cupo de publicaciones de Instagram por hoy.');

  for (const preview of result.skipped) summary(`- omitido ${preview.relPath}: ${preview.reason}`);
  for (const failed of result.failed) {
    summary(`- ❌ ${failed.translationKey}: ${failed.error}${failed.disabled ? " (queda en instagram: 'off')" : ''}`);
  }

  if (dryRun) {
    summary('');
    summary('Dry run: revisa la imagen y el caption de arriba. No se ha publicado nada.');
  } else if (result.failed.length > 0 && result.published.length === 0) {
    return 1;
  }

  return 0;
}

const entryPoint = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (entryPoint === fileURLToPath(import.meta.url)) {
  main()
    .then((code) => {
      process.exitCode = code;
    })
    .catch((error) => {
      summary(`**❌ Error del flujo de Instagram:** ${errorMessage(error)}`);
      process.exitCode = 1;
    });
}
