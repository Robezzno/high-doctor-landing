import { getCollection, type CollectionEntry } from 'astro:content';

import { blogT } from '../../i18n/blog';
import { NEWS_CATEGORIES, type NewsCategory, type NewsLang } from './schema';

/** Posts por página del listado (contrato del prompt 05). */
export const POSTS_PER_PAGE = 12;

export { NEWS_CATEGORIES };
export type { NewsCategory, NewsLang };

/** Entrada de la colección `news`. */
export type NewsEntry = CollectionEntry<'news'>;

/* ------------------------------------------------------------------ */
/* Rutas                                                               */
/* ------------------------------------------------------------------ */

/**
 * El blog vive en `/noticias/` (ES) y `/en/news/` (EN). El resto de idiomas de
 * la web no tienen blog propio y enlazan a la versión EN.
 */
export function blogBase(lang: NewsLang): string {
  return lang === 'es' ? '/noticias/' : '/en/news/';
}

/** Segmento de idioma para las rutas auxiliares: `/noticias/pagina/2/` vs `/en/news/page/2/`. */
function segments(lang: NewsLang): { page: string; category: string } {
  return lang === 'es' ? { page: 'pagina', category: 'categoria' } : { page: 'page', category: 'category' };
}

/** `/noticias/<slug>/` o `/en/news/<slug>/`. */
export function postUrl(lang: NewsLang, slug: string): string {
  return `${blogBase(lang)}${slug}/`;
}

/** Filtro por categoría sin JS: `/noticias/categoria/<cat>/`. */
export function categoryUrl(lang: NewsLang, category: NewsCategory | string): string {
  return `${blogBase(lang)}${segments(lang).category}/${category}/`;
}

/** Paginación: `page` empieza en 2 (la 1 es el listado base). */
export function pageUrl(
  lang: NewsLang,
  page: number,
  category?: NewsCategory | string,
): string {
  const base = category ? categoryUrl(lang, category) : blogBase(lang);
  return `${base}${segments(lang).page}/${page}/`;
}

/** Tarjeta social generada en el build: `/social/<lang>/<slug>.jpg`. */
export function socialCardPath(lang: NewsLang | string, slug: string): string {
  return `/social/${lang}/${slug}.jpg`;
}

/** Imagen Open Graph generada en el build: `/og/<lang>/<slug>.png`. */
export function ogImagePath(lang: NewsLang | string, slug: string): string {
  return `/og/${lang}/${slug}.png`;
}

/** Feed RSS del idioma. */
export function rssUrl(lang: NewsLang): string {
  return `${blogBase(lang)}rss.xml`;
}

/* ------------------------------------------------------------------ */
/* Datos                                                               */
/* ------------------------------------------------------------------ */

/**
 * Slug del post: el id de la colección es `<lang>/<slug>`.
 */
export function slugOf(entry: NewsEntry): string {
  const parts = entry.id.split('/');
  return parts[parts.length - 1] ?? entry.id;
}

/** En build no se publican borradores; en `astro dev` sí, para poder revisarlos. */
const includeDrafts = import.meta.env.DEV;

/** Posts publicados de un idioma, del más reciente al más antiguo. */
export async function getPosts(lang: NewsLang): Promise<NewsEntry[]> {
  const entries = await getCollection(
    'news',
    (entry) => entry.data.lang === lang && (includeDrafts || !entry.data.draft),
  );

  return entries.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

/** Todos los posts (los dos idiomas), ordenados. */
export async function getAllPosts(): Promise<NewsEntry[]> {
  const entries = await getCollection('news', (entry) => includeDrafts || !entry.data.draft);
  return entries.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

/** Un post por idioma y slug. */
export async function getPost(lang: NewsLang, slug: string): Promise<NewsEntry | undefined> {
  const posts = await getPosts(lang);
  return posts.find((post) => slugOf(post) === slug);
}

/** La versión del mismo post en el otro idioma (`translationKey`). */
export async function getTranslation(entry: NewsEntry): Promise<NewsEntry | undefined> {
  const other: NewsLang = entry.data.lang === 'es' ? 'en' : 'es';
  const posts = await getPosts(other);
  return posts.find((post) => post.data.translationKey === entry.data.translationKey);
}

/**
 * Posts relacionados: primero los de la misma categoría; si no hay suficientes,
 * se completan con los más recientes (y la interfaz lo dice con otro título).
 */
export async function getRelated(
  entry: NewsEntry,
  limit = 3,
): Promise<{ posts: NewsEntry[]; isFallback: boolean }> {
  const posts = (await getPosts(entry.data.lang)).filter((post) => post.id !== entry.id);

  const sameCategory = posts.filter((post) => post.data.category === entry.data.category);
  if (sameCategory.length >= limit) {
    return { posts: sameCategory.slice(0, limit), isFallback: false };
  }

  const rest = posts.filter((post) => post.data.category !== entry.data.category);
  return {
    posts: [...sameCategory, ...rest].slice(0, limit),
    isFallback: true,
  };
}

/** Posts del listado, con paginación y filtro opcional por categoría. */
export async function getListing(
  lang: NewsLang,
  options: { category?: NewsCategory; page?: number } = {},
): Promise<{ posts: NewsEntry[]; totalPages: number; page: number }> {
  const all = await getPosts(lang);
  const filtered = options.category
    ? all.filter((post) => post.data.category === options.category)
    : all;
  const totalPages = Math.max(1, Math.ceil(filtered.length / POSTS_PER_PAGE));
  const page = Math.min(Math.max(1, options.page ?? 1), totalPages);
  const start = (page - 1) * POSTS_PER_PAGE;

  return { posts: filtered.slice(start, start + POSTS_PER_PAGE), totalPages, page };
}

/* ------------------------------------------------------------------ */
/* Presentación                                                        */
/* ------------------------------------------------------------------ */

const locales: Record<NewsLang, string> = { es: 'es-ES', en: 'en-GB' };

/** Fecha larga para el listado y el post. */
export function formatDate(date: Date, lang: NewsLang): string {
  return new Intl.DateTimeFormat(locales[lang], {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

/** Fecha corta (mono) para las tarjetas: `01 · 10 · 2026`. */
export function formatShortDate(date: Date): string {
  return date.toISOString().slice(0, 10).split('-').reverse().join(' · ');
}

/** `YYYY-MM-DD` para el atributo `datetime`. */
export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Nombre de la categoría en el idioma del post. */
export function categoryLabel(lang: NewsLang, category: NewsCategory): string {
  return blogT(lang).categories[category] ?? category;
}

/** Autoría legible: `equipo` y `bot` se traducen, cualquier otro valor se muestra tal cual. */
export function authorLabel(lang: NewsLang, author: string): string {
  if (author === 'equipo') return blogT(lang).byTeam;
  if (author === 'bot') return blogT(lang).byBot;
  return author;
}

/** Los posts de salud llevan aviso fijo (contrato del prompt 05). */
export function isHealthPost(entry: NewsEntry): boolean {
  return entry.data.category === 'salud';
}

/** Enlace al blog que le corresponde a cada idioma de la web. */
export function blogHrefForSiteLang(lang: string): string {
  return lang === 'es' ? blogBase('es') : blogBase('en');
}
