import type { NewsCategory, NewsLang } from '../lib/news/schema';

/**
 * Textos del blog. El blog sólo existe en ES y EN (decisión de `docs/PLAN.md`),
 * así que estos textos no pasan por `src/i18n/*.json` (que exige los 8 idiomas).
 * Los seis idiomas restantes usan los textos de EN y su home enlaza a `/en/news/`.
 */
export interface BlogStrings {
  /** Título del listado. */
  newsTitle: string;
  /** Entradilla del listado. */
  newsLead: string;
  /** Etiqueta del post destacado. */
  featuredLabel: string;
  /** Enlace "leer" de cada tarjeta. */
  readPost: string;
  /** Filtro: todas las categorías. */
  allCategories: string;
  /** Etiqueta accesible del filtro. */
  filterLabel: string;
  /** Caja de fuente original. */
  sourceTitle: string;
  sourceHint: string;
  /** Aviso fijo en los posts de salud. */
  healthNotice: string;
  /** Enlace a la otra versión de idioma. */
  otherLanguage: string;
  /** Posts relacionados. */
  relatedTitle: string;
  relatedFallbackTitle: string;
  /** Compartir sin JS de terceros. */
  shareTitle: string;
  /** Autoría. */
  byTeam: string;
  byBot: string;
  /** Estado vacío. */
  emptyList: string;
  emptyCategory: string;
  /** Paginación. */
  paginationPrev: string;
  paginationNext: string;
  /** Migas y navegación. */
  backToBlog: string;
  rssLabel: string;
  /** Nombre de cada categoría. */
  categories: Record<NewsCategory, string>;
}

const es: BlogStrings = {
  newsTitle: 'Noticias',
  newsLead:
    'Novedades de la fundación, contexto sobre investigación y herramientas para leer la actualidad del cannabis con criterio.',
  featuredLabel: 'Destacado',
  readPost: 'Leer',
  allCategories: 'Todas',
  filterLabel: 'Filtrar por categoría',
  sourceTitle: 'Fuente original',
  sourceHint: 'Enlazamos siempre el origen de la información para que puedas comprobarla.',
  healthNotice: 'Contenido informativo, no sustituye consejo médico.',
  otherLanguage: 'Read in English',
  relatedTitle: 'Noticias relacionadas',
  relatedFallbackTitle: 'También te puede interesar',
  shareTitle: 'Compartir',
  byTeam: 'Equipo',
  byBot: 'Redacción',
  emptyList: 'Todavía no hay noticias publicadas.',
  emptyCategory: 'Todavía no hay noticias en esta categoría.',
  paginationPrev: 'Anterior',
  paginationNext: 'Siguiente',
  backToBlog: 'Todas las noticias',
  rssLabel: 'RSS',
  categories: {
    investigacion: 'Investigación',
    salud: 'Salud',
    legislacion: 'Legislación',
    cultura: 'Cultura',
    fundacion: 'Fundación',
    eventos: 'Eventos',
  },
};

const en: BlogStrings = {
  newsTitle: 'News',
  newsLead:
    'Foundation updates, research context and tools to read cannabis coverage with a critical eye.',
  featuredLabel: 'Featured',
  readPost: 'Read',
  allCategories: 'All',
  filterLabel: 'Filter by category',
  sourceTitle: 'Original source',
  sourceHint: 'We always link the origin of the information so you can check it.',
  healthNotice: 'Informational content. This does not replace medical advice.',
  otherLanguage: 'Leer en español',
  relatedTitle: 'Related news',
  relatedFallbackTitle: 'You may also like',
  shareTitle: 'Share',
  byTeam: 'Team',
  byBot: 'Newsroom',
  emptyList: 'No news published yet.',
  emptyCategory: 'No news in this category yet.',
  paginationPrev: 'Previous',
  paginationNext: 'Next',
  backToBlog: 'All news',
  rssLabel: 'RSS',
  categories: {
    investigacion: 'Research',
    salud: 'Health',
    legislacion: 'Legislation',
    cultura: 'Culture',
    fundacion: 'Foundation',
    eventos: 'Events',
  },
};

const blogStrings: Record<NewsLang, BlogStrings> = { es, en };

/** Textos del blog para un idioma del blog (ES o EN). */
export function blogT(lang: NewsLang): BlogStrings {
  return blogStrings[lang];
}
