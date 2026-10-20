import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

import { createNewsSchema } from './lib/news/schema';

/**
 * Colección del blog: `src/content/news/<lang>/<slug>.md`.
 *
 * El esquema (y el contrato completo) viven en `src/lib/news/schema.ts` y
 * `docs/CONTENIDO.md`. Aquí sólo se le pasa `image()` de Astro para que `cover`
 * sea una imagen local optimizable; si falta, la portada es la tarjeta generada.
 */
const news = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/news' }),
  schema: ({ image }) => createNewsSchema(image()),
});

export const collections = { news };
