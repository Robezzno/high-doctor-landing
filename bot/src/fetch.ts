/**
 * Lectura de fuentes y normalización a FeedItem.
 *
 * Dos adaptadores:
 *  - `rss`: feed RSS 2.0 / Atom con rss-parser.
 *  - `pubmed`: API pública E-utilities (PubMed dejó de servir RSS para
 *    búsquedas arbitrarias; esto es gratis y no necesita clave).
 */
import Parser from 'rss-parser';
import type { FeedItem, Source } from './types.js';
import { canonicalizeUrl } from './filter.js';

const USER_AGENT = 'HighDoctorFoundationBot/1.0 (+https://highdoctor.foundation)';
const REQUEST_TIMEOUT_MS = 30_000;

const parser: Parser<Record<string, unknown>, Record<string, unknown>> = new Parser({
  timeout: REQUEST_TIMEOUT_MS,
  headers: { 'User-Agent': USER_AGENT, Accept: 'application/rss+xml, application/xml, text/xml, */*' },
  customFields: {
    item: [
      ['content:encoded', 'contentEncoded'],
      ['dc:date', 'dcDate'],
      ['summary', 'summaryField'],
    ],
  },
});

/** Quita etiquetas HTML y normaliza espacios. */
export function stripHtml(input: string | undefined | null): string {
  if (!input) return '';
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function toDate(...candidates: (string | undefined)[]): Date | null {
  for (const candidate of candidates) {
    if (!candidate) continue;
    const parsed = new Date(candidate);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return null;
}

function baseItem(source: Source, fields: Partial<FeedItem> & { title: string; url: string }): FeedItem {
  return {
    sourceId: source.id,
    sourceName: source.name,
    sourceWeight: source.weight,
    defaultCategory: source.category,
    sourceLang: source.lang ?? 'en',
    title: stripHtml(fields.title) || '(sin título)',
    url: fields.url,
    canonicalUrl: canonicalizeUrl(fields.url),
    publishedAt: fields.publishedAt ?? null,
    summary: fields.summary ?? '',
    content: fields.content,
  };
}

async function fetchRss(source: Source): Promise<FeedItem[]> {
  const feed = await parser.parseURL(source.url);
  const items: FeedItem[] = [];

  for (const entry of feed.items ?? []) {
    const raw = entry as Record<string, any>;
    const link: string = raw.link ?? raw.guid ?? '';
    if (!link) continue;

    const title: string = raw.title ?? '';
    if (!title) continue;

    const summary = stripHtml(raw.contentSnippet ?? raw.summaryField ?? raw.summary ?? raw.content ?? '');
    const content = stripHtml(raw.contentEncoded ?? raw['content:encoded'] ?? '');

    items.push(
      baseItem(source, {
        title,
        url: link,
        publishedAt: toDate(raw.isoDate, raw.pubDate, raw.dcDate, raw.updated, raw.published),
        summary,
        content: content || undefined,
      }),
    );
  }

  return items;
}

const PUBMED_MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

/** Fechas de PubMed: "2026 Oct 19", "2026 Oct", "2026" o "2026/10/19 00:00". */
export function parsePubMedDate(input: string | undefined): Date | null {
  if (!input) return null;
  const text = input.trim();

  const slash = text.match(/^(\d{4})\/(\d{2})\/(\d{2})/);
  if (slash) return new Date(Date.UTC(Number(slash[1]), Number(slash[2]) - 1, Number(slash[3])));

  const words = text.match(/^(\d{4})(?:\s+([A-Za-z]{3}))?(?:\s+(\d{1,2}))?/);
  if (words) {
    const year = Number(words[1]);
    const month = words[2] ? PUBMED_MONTHS[words[2].toLowerCase()] : 0;
    const day = words[3] ? Number(words[3]) : 1;
    if (month === undefined) return null;
    return new Date(Date.UTC(year, month, day));
  }
  return null;
}

interface PubMedSummary {
  uid: string;
  title?: string;
  pubdate?: string;
  epubdate?: string;
  sortpubdate?: string;
  fulljournalname?: string;
  source?: string;
  authors?: { name: string }[];
  elocationid?: string;
}

/** Abstracts en un solo lote (si falla, se sigue sólo con los títulos). */
async function fetchPubMedAbstracts(baseUrl: string, ids: string[]): Promise<Map<string, string>> {
  const abstracts = new Map<string, string>();
  if (ids.length === 0) return abstracts;
  try {
    const url = `${baseUrl}/efetch.fcgi?db=pubmed&rettype=abstract&retmode=xml&id=${ids.join(',')}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) return abstracts;
    const xml = await response.text();

    for (const block of xml.split(/<PubmedArticle>/).slice(1)) {
      const uid = block.match(/<PMID[^>]*>(\d+)<\/PMID>/)?.[1];
      if (!uid) continue;
      const parts = [...block.matchAll(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/g)].map(
        (match) => stripHtml(match[1]),
      );
      if (parts.length > 0) abstracts.set(uid, parts.join(' '));
    }
  } catch {
    // Sin abstracts: el filtro usará el título, que es suficiente para descartar.
  }
  return abstracts;
}

async function fetchPubMed(source: Source): Promise<FeedItem[]> {
  const baseUrl = source.url.replace(/\/+$/, '');
  const term = encodeURIComponent(source.query ?? 'cannabinoid OR cannabidiol');
  const retmax = Math.min(Math.max(source.retmax ?? 20, 1), 50);

  const searchUrl = `${baseUrl}/esearch.fcgi?db=pubmed&retmode=json&sort=date&retmax=${retmax}&term=${term}`;
  const searchResponse = await fetch(searchUrl, {
    headers: { 'User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!searchResponse.ok) {
    throw new Error(`PubMed esearch ${searchResponse.status}: ${searchResponse.statusText}`);
  }
  const search = (await searchResponse.json()) as { esearchresult?: { idlist?: string[] } };
  const ids = search.esearchresult?.idlist ?? [];
  if (ids.length === 0) return [];

  const summaryUrl = `${baseUrl}/esummary.fcgi?db=pubmed&retmode=json&id=${ids.join(',')}`;
  const summaryResponse = await fetch(summaryUrl, {
    headers: { 'User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!summaryResponse.ok) {
    throw new Error(`PubMed esummary ${summaryResponse.status}: ${summaryResponse.statusText}`);
  }
  const summary = (await summaryResponse.json()) as {
    result?: Record<string, PubMedSummary | string[]>;
  };
  const abstracts = await fetchPubMedAbstracts(baseUrl, ids);

  const items: FeedItem[] = [];
  for (const id of ids) {
    const entry = summary.result?.[id] as PubMedSummary | undefined;
    if (!entry || typeof entry === 'string') continue;

    const title = stripHtml(entry.title ?? '');
    if (!title) continue;

    const publishedAt =
      parsePubMedDate(entry.epubdate) ??
      parsePubMedDate(entry.sortpubdate) ??
      parsePubMedDate(entry.pubdate);
    const journal = entry.fulljournalname ?? entry.source ?? 'PubMed';
    const authors = (entry.authors ?? [])
      .slice(0, 3)
      .map((author) => author.name)
      .join(', ');
    const abstract = abstracts.get(id) ?? '';
    const url = `https://pubmed.ncbi.nlm.nih.gov/${id}/`;

    items.push(
      baseItem(source, {
        title,
        url,
        publishedAt,
        summary: [journal, entry.pubdate, authors, abstract].filter(Boolean).join('. '),
        content: abstract || undefined,
      }),
    );
  }

  return items;
}

export interface FetchReport {
  items: FeedItem[];
  errors: { sourceId: string; message: string }[];
}

/** Descarga todas las fuentes. Un fallo de una fuente no tumba la ejecución. */
export async function fetchAll(sources: Source[]): Promise<FetchReport> {
  const items: FeedItem[] = [];
  const errors: { sourceId: string; message: string }[] = [];

  for (const source of sources) {
    try {
      const batch = source.type === 'pubmed' ? await fetchPubMed(source) : await fetchRss(source);
      console.log(`[fetch] ${source.id}: ${batch.length} noticias`);
      items.push(...batch);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[fetch] ${source.id}: error (${message})`);
      errors.push({ sourceId: source.id, message });
    }
  }

  return { items, errors };
}
