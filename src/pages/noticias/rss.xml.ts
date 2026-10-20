import rss from '@astrojs/rss';
import type { APIContext } from 'astro';

import { blogT } from '../../i18n/blog';
import { blogBase, getPosts, postUrl, rssUrl, slugOf } from '../../lib/news';

/** Feed RSS del blog en español: `/noticias/rss.xml`. */
export async function GET(context: APIContext) {
  const lang = 'es' as const;
  const posts = await getPosts(lang);
  const strings = blogT(lang);

  return rss({
    title: `High Doctor Foundation — ${strings.newsTitle}`,
    description: strings.newsLead,
    // El canal apunta al listado del blog, no a la portada de la web.
    site: new URL(blogBase(lang), context.site ?? 'https://highdoctor.foundation'),
    trailingSlash: true,
    xmlns: { atom: 'http://www.w3.org/2005/Atom' },
    // `<language>` y el enlace canónico del feed (recomendado por el validador del W3C).
    customData:
      `<language>${lang}</language>` +
      `<atom:link href="${new URL(rssUrl(lang), context.site ?? 'https://highdoctor.foundation').href}" rel="self" type="application/rss+xml" />`,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.summary,
      pubDate: post.data.date,
      link: postUrl(lang, slugOf(post)),
      categories: [...new Set([post.data.category, ...post.data.tags])],
    })),
  });
}
