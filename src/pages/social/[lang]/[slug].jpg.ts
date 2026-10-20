import type { APIRoute } from 'astro';

import { getAllPosts, slugOf, type NewsEntry } from '../../../lib/news';
import { renderSocialCard } from '../../../../scripts/social-card';

/**
 * Tarjeta social de cada noticia: `/social/<lang>/<slug>.jpg`.
 * 1080×1350, JPEG calidad 88, sRGB y menos de 1 MB (formato vertical de Instagram).
 * Se genera en el build, así que la URL pública existe antes de que el workflow de
 * Instagram la pida (prompt 08).
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

  const jpeg = await renderSocialCard({
    lang: entry.data.lang,
    slug: slugOf(entry),
    title: entry.data.title,
    hook: entry.data.instagramHook,
    category: entry.data.category,
    date: entry.data.date,
  });

  return new Response(new Uint8Array(jpeg), {
    headers: { 'Content-Type': 'image/jpeg' },
  });
};
