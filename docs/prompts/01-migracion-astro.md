# 01 — Migrar la web a Astro (sin cambiar el diseño todavía)

## Objetivo
Conseguir la **misma web** que hay ahora, con el mismo aspecto y los mismos textos, generada con Astro, con una página HTML estática por idioma y desplegada con GitHub Actions en el mismo dominio. El rediseño llega en el prompt 02: aquí sólo se cambian los cimientos.

## Tareas
1. Crea el proyecto Astro (última versión estable, TypeScript strict) **en la raíz del repo**. Mueve la web antigua a `legacy/` como referencia y exclúyela del build. `docs/` se queda donde está.
2. Estructura:
   - `src/i18n/<lang>.json`: extrae las 92 claves de cada idioma del objeto `translations` de `script.js` con un script, no a mano. Añade un helper `t(lang, key)` tipado que falle en build si falta una clave en algún idioma.
   - i18n nativo de Astro: `defaultLocale: 'en'`, `locales: ['en','es','de','fr','it','pt','nl','pl']` y `prefixDefaultLocale: false`. Rutas `/`, `/es/`, `/de/`…
   - `src/layouts/Base.astro` con `<html lang>`, meta, `hreflang` alternates y canonical.
   - Componentes por sección: `Nav`, `Hero`, `Mission`, `Impact`, `Join`, `Event` (la actual Mary Jane), `ContactForm` y `Footer`.
   - El selector de idioma pasa a ser enlaces a la ruta equivalente (sin JS). En la primera visita a `/`, redirige **una sola vez** según `navigator.language`, con un script inline mínimo que guarda la preferencia en localStorage dentro de un try/catch.
   - El formulario conserva la lógica arreglada en el prompt 00 (fetch a Web3Forms + consentimiento), como script de cliente del componente.
   - Imágenes en `src/assets/`, servidas con `<Image>` de Astro (AVIF/WebP y tamaños responsive).
3. `public/CNAME` con `highdoctor.foundation`. Esto es **imprescindible**: sin él, el dominio se cae.
4. `.github/workflows/deploy.yml` con las acciones oficiales `withastro/action` + `actions/deploy-pages`, que se lanza en cada push a `main` y con `workflow_dispatch`.
5. Cambia GitHub Pages de modo *legacy* a *workflow*, **sólo después** de que el build funcione en local:
   `gh api -X PUT repos/Robezzno/high-doctor-landing/pages -f build_type=workflow`
   Después comprueba que el dominio y el HTTPS siguen activos (`gh api repos/Robezzno/high-doctor-landing/pages`).

## Verificación
- `npm run build` sin warnings de i18n. Hay `dist/index.html`, `dist/es/index.html`… (8 en total) y `dist/CNAME`.
- Compara capturas de la web antigua (`legacy/`) y la nueva en las 8 rutas, a 390 px y 1440 px: tienen que ser visualmente equivalentes.
- Tras el push: el workflow sale en verde, `curl -sI https://highdoctor.foundation` devuelve 200, `/es/` muestra el contenido en español y el formulario envía.
- Actualiza `docs/TAREAS.md`, haz commit `feat: migración a Astro con rutas por idioma y deploy con Actions` y push.
