import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // Dominio de producción: se usa para canonical, hreflang y el sitemap futuro.
  site: 'https://highdoctor.foundation',
  output: 'static',
  // El CSS va dentro del HTML: pesa ~6 KB comprimido y se ahorra una ida y
  // vuelta de red antes de pintar (Lighthouse, 2026-11-21).
  build: { inlineStylesheets: 'always' },
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es', 'de', 'fr', 'it', 'pt', 'nl', 'pl'],
    routing: {
      // EN vive en `/`; el resto en `/es/`, `/de/`…
      prefixDefaultLocale: false,
    },
  },
  // `legacy/` queda fuera de `src/`, así que la web antigua no entra en el build.
  integrations: [
    sitemap({
      // Las 8 versiones de idioma de cada URL quedan como `xhtml:link` alternate
      // dentro del propio sitemap (sitemap-index.xml + sitemap-0.xml).
      i18n: {
        defaultLocale: 'en',
        locales: {
          en: 'en',
          es: 'es',
          de: 'de',
          fr: 'fr',
          it: 'it',
          pt: 'pt',
          nl: 'nl',
          pl: 'pl',
        },
      },
    }),
  ],
});
