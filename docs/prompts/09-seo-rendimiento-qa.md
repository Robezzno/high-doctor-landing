# 09 — SEO, rendimiento y QA final

## SEO técnico
- `@astrojs/sitemap` con las alternativas por idioma (`i18n` en la config del sitemap) y `robots.txt` que apunte al sitemap.
- Meta por página: `title` único (≤ 60), `description` (≤ 155), canonical, `hreflang` + `x-default`, Open Graph y Twitter Card con las imágenes `/og/...` del prompt 05 (en la home, una og:image de marca propia).
- JSON-LD: `NGO` (u `Organization`) en la home con logo, `sameAs` (las redes del prompt 04) y dirección. `NewsArticle` en cada post con `author`, `datePublished`, `image` y `isBasedOn` (la fuente) para los del bot. `BreadcrumbList` en el blog. Valídalo con el validador de schema.org.
- Página 404 con el personaje ("Este experimento no existe") y enlaces útiles, en el idioma correcto si es posible.
- Envía el sitemap a Google Search Console: explícale a Saf en 3 pasos cómo verificar el dominio (registro DNS TXT, gratis), porque no lo puede hacer el agente.

## Rendimiento
- Objetivo de Lighthouse en móvil (home, listado y post), en los 4 apartados: **≥ 95**. Mídelo con `npx lighthouse` o `unlighthouse` sobre `npm run preview` y guarda los informes en `docs/capturas/09/`.
- Las fuentes se precargan sólo para el peso del titular y con `font-display: swap`; las imágenes tienen `width/height` y `loading="lazy"` excepto la del hero (`fetchpriority="high"`). Revisa que ningún asset de la portada pase de 200 KB.
- Cache: los assets con hash ya los sirve bien Pages. Comprueba que no se cuela JS innecesario (`astro build` → revisa los tamaños de los bundles).

## QA final
1. Recorre con Playwright las rutas principales en 8 idiomas × 2 viewports (390 y 1440) y guarda las capturas. Un test falla si hay errores de consola, enlaces internos rotos (crawler sobre `dist/`) o imágenes sin `alt`.
2. Accesibilidad con `@axe-core/playwright`: 0 violaciones serias o críticas.
3. Formulario E2E con Web3Forms simulado (intercepta la petición) en éxito y en error.
4. Prueba con `prefers-reduced-motion` y con JS desactivado.
5. Workflow `ci.yml` en PRs: `astro check`, tests de `bot/` (vitest), build y el crawler de enlaces.
6. Repasa el anti-checklist del prompt 02 sobre la web en producción.

## Cierre
- `README.md` del repo reescrito en español: qué es, cómo publicar (enlace a `docs/COMO-PUBLICAR.md`), cómo funciona el bot e Instagram, cómo pausar cada cosa y qué secrets existen (sólo los nombres).
- `docs/TAREAS.md` con todo marcado y una sección de "Mantenimiento" (token de IG, revisión mensual de fuentes del bot, el paso de `review` a `publish`).
- Commit `chore: SEO, rendimiento y QA final` y push. Comprobación final en producción.
