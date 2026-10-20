/**
 * Filtro de noticias: frescura, deduplicado y vetos.
 *
 * Todo es puro (sin red ni disco) para poder testearlo con vitest.
 * El resultado es como mucho UNA noticia por ejecución: si nada supera el
 * umbral, es preferible no publicar a publicar relleno.
 */
import type { BotConfig, FeedItem, SeenState, VetoRule } from './types.js';

/** Parámetros que afectan a la normalización de URLs. */
const TRACKING_PARAMS = new Set([
  'fbclid',
  'gclid',
  'dclid',
  'msclkid',
  'mc_cid',
  'mc_eid',
  'igshid',
  'ref',
  'referrer',
  'source',
  'campaign',
  's',
  'at_medium',
  'at_campaign',
  'at_custom1',
  '_hsenc',
  '_hsmi',
]);

/** Minúsculas, sin acentos, sin puntuación y con espacios simples. */
export function normalizeText(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Trigramas de caracteres del texto normalizado (con espacios de borde). */
export function trigrams(input: string): Set<string> {
  const text = ` ${normalizeText(input)} `;
  const grams = new Set<string>();
  for (let i = 0; i + 3 <= text.length; i += 1) {
    grams.add(text.slice(i, i + 3));
  }
  return grams;
}

/**
 * Similitud entre dos títulos: coeficiente de Dice sobre trigramas.
 * 0 = nada en común, 1 = idénticos. Umbral del bot: 0,6.
 */
export function titleSimilarity(a: string, b: string): number {
  const left = trigrams(a);
  const right = trigrams(b);
  if (left.size === 0 || right.size === 0) return 0;
  let shared = 0;
  for (const gram of left) {
    if (right.has(gram)) shared += 1;
  }
  return (2 * shared) / (left.size + right.size);
}

/**
 * URL canónica para deduplicar: sin protocolo distinto, sin `www.`, sin
 * fragmento, sin parámetros de seguimiento y sin barra final.
 */
export function canonicalizeUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl.trim());
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    const params = [...url.searchParams.entries()]
      .filter(([key]) => {
        const lower = key.toLowerCase();
        return !TRACKING_PARAMS.has(lower) && !lower.startsWith('utm_');
      })
      .sort(([a], [b]) => (a === b ? 0 : a < b ? -1 : 1));

    let pathname = url.pathname.replace(/\/+$/, '');
    if (pathname === '') pathname = '/';

    const query = params.length > 0 ? `?${new URLSearchParams(params).toString()}` : '';
    return `${host}${pathname}${query}`.toLowerCase();
  } catch {
    return rawUrl.trim().toLowerCase();
  }
}

/** ¿La noticia se publicó dentro de la ventana permitida? */
export function isFresh(publishedAt: Date | null, now: Date, maxAgeHours: number): boolean {
  if (!publishedAt || Number.isNaN(publishedAt.getTime())) return false;
  const ageMs = now.getTime() - publishedAt.getTime();
  // Se tolera un margen de 10 minutos por desfases de reloj entre el medio y nosotros.
  return ageMs <= maxAgeHours * 3600_000 + 10 * 60_000;
}

/**
 * Un patrón vale si al normalizarlo conserva al menos 3 caracteres. Evita
 * patrones que se quedan en una letra ("€/g" -> "g") y vetarían todo.
 */
function usablePattern(pattern: string): string | null {
  const needle = normalizeText(pattern);
  return needle.length >= 3 ? needle : null;
}

/** Primer tema vetado que aparezca en título o resumen. */
export function findVeto(item: FeedItem, vetos: VetoRule[]): VetoRule | null {
  const haystack = normalizeText(`${item.title} ${item.summary}`);
  for (const veto of vetos) {
    for (const pattern of veto.patterns) {
      const needle = usablePattern(pattern);
      if (needle && haystack.includes(needle)) return veto;
    }
  }
  return null;
}

export interface ScoredItem {
  item: FeedItem;
  score: number;
  keywordHits: string[];
}

/** Relevancia = coincidencias de palabras clave + peso de la fuente. */
export function scoreItem(item: FeedItem, config: BotConfig): ScoredItem {
  const haystack = normalizeText(`${item.title} ${item.summary}`);
  let score = 0;
  const keywordHits: string[] = [];

  for (const rules of Object.values(config.keywords)) {
    for (const rule of rules) {
      const needle = usablePattern(rule.pattern);
      if (needle && haystack.includes(needle)) {
        score += rule.weight;
        keywordHits.push(rule.pattern);
      }
    }
  }

  score += item.sourceWeight;
  return { item, score, keywordHits };
}

export type RejectReason =
  | 'sin-fecha'
  | 'no-fresco'
  | 'veto'
  | 'duplicado-url'
  | 'duplicado-titulo'
  | 'baja-puntuacion';

export interface Rejection {
  title: string;
  sourceId: string;
  reason: RejectReason;
  detail?: string;
}

export interface SelectionResult {
  selected: FeedItem | null;
  scored: ScoredItem[];
  rejected: Rejection[];
}

export interface SelectOptions {
  items: FeedItem[];
  config: BotConfig;
  seen: SeenState;
  /** Títulos de los posts ya publicados (ES y EN). */
  existingTitles: string[];
  now: Date;
}

function dedupeCandidates(
  candidates: ScoredItem[],
  threshold: number,
  rejected: Rejection[],
): ScoredItem[] {
  const kept: ScoredItem[] = [];
  const byUrl = new Map<string, ScoredItem>();

  for (const candidate of candidates) {
    const key = candidate.item.canonicalUrl;
    const previous = byUrl.get(key);
    if (previous) {
      const winner = candidate.score > previous.score ? candidate : previous;
      const loser = winner === candidate ? previous : candidate;
      rejected.push({
        title: loser.item.title,
        sourceId: loser.item.sourceId,
        reason: 'duplicado-url',
        detail: loser.item.canonicalUrl,
      });
      byUrl.set(key, winner);
      const index = kept.indexOf(previous);
      if (index >= 0) kept[index] = winner;
      else kept.push(winner);
      continue;
    }
    byUrl.set(key, candidate);
    kept.push(candidate);
  }

  // Deduplicado por similitud de título dentro del mismo lote.
  const unique: ScoredItem[] = [];
  for (const candidate of kept) {
    const twin = unique.find(
      (other) => titleSimilarity(other.item.title, candidate.item.title) >= threshold,
    );
    if (!twin) {
      unique.push(candidate);
      continue;
    }
    const winner = candidate.score > twin.score ? candidate : twin;
    const loser = winner === candidate ? twin : candidate;
    rejected.push({
      title: loser.item.title,
      sourceId: loser.item.sourceId,
      reason: 'duplicado-titulo',
      detail: `similar a "${winner.item.title.slice(0, 80)}"`,
    });
    unique[unique.indexOf(twin)] = winner;
  }

  return unique;
}

/** Elige la mejor noticia del lote, o ninguna. */
export function selectArticle({
  items,
  config,
  seen,
  existingTitles,
  now,
}: SelectOptions): SelectionResult {
  const rejected: Rejection[] = [];
  const fresh: ScoredItem[] = [];

  for (const item of items) {
    if (!item.publishedAt || Number.isNaN(item.publishedAt.getTime())) {
      rejected.push({ title: item.title, sourceId: item.sourceId, reason: 'sin-fecha' });
      continue;
    }
    if (!isFresh(item.publishedAt, now, config.maxAgeHours)) {
      rejected.push({
        title: item.title,
        sourceId: item.sourceId,
        reason: 'no-fresco',
        detail: item.publishedAt.toISOString(),
      });
      continue;
    }
    const veto = findVeto(item, config.vetos);
    if (veto) {
      rejected.push({
        title: item.title,
        sourceId: item.sourceId,
        reason: 'veto',
        detail: veto.label,
      });
      continue;
    }
    fresh.push(scoreItem(item, config));
  }

  const seenUrls = new Set(seen.seen.map((entry) => canonicalizeUrl(entry.url)));
  const knownTitles = [...seen.seen.map((entry) => entry.title), ...existingTitles];

  const dedupedBatch = dedupeCandidates(fresh, config.titleSimilarityThreshold, rejected);

  const notSeen: ScoredItem[] = [];
  for (const candidate of dedupedBatch) {
    if (seenUrls.has(candidate.item.canonicalUrl)) {
      rejected.push({
        title: candidate.item.title,
        sourceId: candidate.item.sourceId,
        reason: 'duplicado-url',
        detail: 'ya está en state/seen.json',
      });
      continue;
    }
    const twin = knownTitles.find(
      (title) => titleSimilarity(title, candidate.item.title) >= config.titleSimilarityThreshold,
    );
    if (twin) {
      rejected.push({
        title: candidate.item.title,
        sourceId: candidate.item.sourceId,
        reason: 'duplicado-titulo',
        detail: `similar a "${twin.slice(0, 80)}"`,
      });
      continue;
    }
    notSeen.push(candidate);
  }

  const eligible = notSeen.filter((candidate) => {
    if (candidate.score < config.minScore) {
      rejected.push({
        title: candidate.item.title,
        sourceId: candidate.item.sourceId,
        reason: 'baja-puntuacion',
        detail: `${candidate.score} < ${config.minScore}`,
      });
      return false;
    }
    return true;
  });

  const ranked = eligible.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const timeA = a.item.publishedAt?.getTime() ?? 0;
    const timeB = b.item.publishedAt?.getTime() ?? 0;
    return timeB - timeA;
  });

  // Una noticia por ejecución (max_per_run en config.yml).
  const limit = Math.max(1, config.maxPerRun);
  return { selected: ranked[0]?.item ?? null, scored: ranked.slice(0, limit), rejected };
}
