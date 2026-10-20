import type { APIRoute } from 'astro';

import { getAllPosts, slugOf, type NewsEntry } from '../../../lib/news';
import { renderOgImage } from '../../../../scripts/social-card';

/**
 * Imagen Open Graph de cada noticia: `/og/<lang>/<slug>.png`, 1200×630.
 * Misma plantilla que la tarjeta de Instagram, en horizontal.
 */
export async function getStaticPaths() {
  const posts = await getAllPosts();

  return posts.map((entry) => ({
    params: { lang: entry.data.lang, slug: slugOf(entry) },
    props: { entry },
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const { entry } = props as { entry: NewsEntry };

  const png = await renderOgImage({
    lang: entry.data.lang,
    slug: slugOf(entry),
    title: entry.data.title,
    hook: entry.data.instagramHook,
    category: entry.data.category,
    date: entry.data.date,
  });

  return new Response(new Uint8Array(png), {
    headers: { 'Content-Type': 'image/png' },
  });
};
