import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

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

/**
 * Colección de eventos: `src/content/events/<slug>.md`.
 *
 * Un evento es una ficha mínima (título, fecha, ciudad y enlace). El archivado
 * es automático en el build: lo que ya pasó se mueve a "eventos pasados" según
 * la fecha del build (`src/lib/events/archive.ts`). `date: null` significa
 * "por confirmar" y `draft: true` significa "no publicar todavía".
 *
 * La sección sólo se pinta con `sections.events` en `true`
 * (`src/config/site.ts`); hoy está oculta porque todavía no hay eventos reales.
 */
const events = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/events' }),
  schema: z.object({
    title: z.string().min(1).max(90),
    /** Fecha civil ISO (`YYYY-MM-DD`) o `null` si está por confirmar. */
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'la fecha debe ser ISO: YYYY-MM-DD')
      .nullable()
      .default(null),
    city: z.string().min(1),
    /** Enlace oficial del evento (entradas, ficha o web del organizador). */
    url: z.url().nullable().default(null),
    /** Stand o ubicación dentro del recinto, si existe. */
    stand: z.string().min(1).optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { news, events };
