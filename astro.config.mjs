import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // Dominio de producción: se usa para canonical, hreflang y el sitemap futuro.
  site: 'https://highdoctor.foundation',
  output: 'static',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es', 'de', 'fr', 'it', 'pt', 'nl', 'pl'],
    routing: {
      // EN vive en `/`; el resto en `/es/`, `/de/`…
      prefixDefaultLocale: false,
    },
  },
  // `legacy/` queda fuera de `src/`, así que la web antigua no entra en el build.
});
