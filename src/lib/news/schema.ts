import { z } from 'astro/zod';

/**
 * Esquema de la colección `news`.
 *
 * Vive fuera de `src/content.config.ts` para poder probarlo con Vitest sin
 * arrancar Astro. `content.config.ts` lo completa con `image()` de Astro para
 * que `cover` sea una imagen local optimizable; en los tests basta con una
 * ruta de texto, por eso el schema de la portada es un parámetro.
 *
 * El contrato completo está documentado en `docs/CONTENIDO.md`.
 */

/** Categorías del blog. Los valores son también el slug de `/…/categoria/<cat>/`. */
export const NEWS_CATEGORIES = [
  'investigacion',
  'salud',
  'legislacion',
  'cultura',
  'fundacion',
  'eventos',
] as const;

export type NewsCategory = (typeof NEWS_CATEGORIES)[number];

/** Idiomas del blog. El resto de idiomas de la web enlazan a la versión EN. */
export const NEWS_LANGS = ['es', 'en'] as const;

export type NewsLang = (typeof NEWS_LANGS)[number];

/** Estado de publicación en Instagram (lo consume el prompt 08). */
export const INSTAGRAM_STATUSES = ['off', 'pending', 'published'] as const;

export type InstagramStatus = (typeof INSTAGRAM_STATUSES)[number];

/** Límites de longitud del contrato. */
export const TITLE_MAX = 90;
export const SUMMARY_MAX = 200;
export const INSTAGRAM_HOOK_MAX = 80;

/** El bot no publica nada sin enlace a la fuente original. */
const botNeedsSource = (post: { author: string; source?: unknown }, ctx: z.RefinementCtx) => {
  if (post.author === 'bot' && !post.source) {
    ctx.addIssue({
      code: 'custom',
      path: ['source'],
      message: 'author "bot" exige "source" con name y url (contrato de contenido, ver docs/CONTENIDO.md)',
    });
  }
};

/**
 * Construye el esquema de la colección.
 * @param coverSchema Schema de la portada. Por defecto una ruta de texto.
 */
export function createNewsSchema<Cover extends z.ZodType = z.ZodString>(
  coverSchema?: Cover,
) {
  const cover = coverSchema ?? (z.string() as unknown as Cover);

  return z
    .object({
      title: z.string().min(1).max(TITLE_MAX),
      summary: z.string().min(1).max(SUMMARY_MAX),
      date: z.coerce.date(),
      lang: z.enum(NEWS_LANGS),
      translationKey: z.string().min(1),
      category: z.enum(NEWS_CATEGORIES),
      tags: z.array(z.string().min(1)).default([]),
      cover: cover.optional(),
      coverAlt: z.string().min(1).optional(),
      source: z
        .object({
          name: z.string().min(1),
          url: z.url(),
        })
        .optional(),
      author: z.string().min(1),
      draft: z.boolean().default(false),
      instagram: z.enum(INSTAGRAM_STATUSES).default('pending'),
      instagramId: z.string().min(1).optional(),
      instagramHook: z.string().min(1).max(INSTAGRAM_HOOK_MAX).optional(),
    })
    .superRefine(botNeedsSource);
}

/** Esquema por defecto (portada como ruta de texto). Lo usan los tests. */
export const newsSchema = createNewsSchema();

export type NewsData = z.infer<typeof newsSchema>;
