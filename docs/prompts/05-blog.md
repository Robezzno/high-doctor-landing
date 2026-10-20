# 05 — Blog de noticias + generador de tarjetas sociales

## Objetivo
Un blog de noticias integrado en el diseño, en ES y EN, que sirva a la vez para publicar a mano (prompt 06), para el bot (prompt 07) y para Instagram (prompt 08). **El formato de los posts es el contrato entre las tres piezas**: defínelo bien y documéntalo.

## Contrato de contenido
Colección `news` en `src/content/news/<lang>/<slug>.md` (lang = `es` | `en`). Schema Zod en `src/content.config.ts`:

```ts
{
  title: string (≤ 90),
  summary: string (≤ 200),          // se usa en listados, og:description y caption de IG
  date: date,
  lang: 'es' | 'en',
  translationKey: string,           // une la versión ES y EN del mismo post
  category: 'investigacion' | 'salud' | 'legislacion' | 'cultura' | 'fundacion' | 'eventos',
  tags: string[],
  cover?: image(),                  // opcional: si falta, se usa la tarjeta generada
  coverAlt?: string,
  source?: { name: string, url: url },  // obligatorio si author = 'bot'
  author: 'bot' | 'equipo' | string,
  draft: boolean (default false),
  instagram: 'off' | 'pending' | 'published' (default 'pending'),
  instagramId?: string,
  instagramHook?: string (≤ 80)     // frase gancho para la tarjeta; si falta, usar title
}
```
Documenta este contrato en `docs/CONTENIDO.md` con un ejemplo de post completo.

## Páginas
- `/noticias/` (EN: `/en/news/`; el resto de idiomas redirige o enlaza a la versión EN): listado con un post destacado grande y luego una lista editorial con fecha en mono, categoría tipo etiqueta de espécimen, título y resumen. Filtro por categoría sin JS (rutas `/noticias/categoria/<cat>/`) y paginación de 12.
- `/noticias/<slug>/`: tipografía editorial cuidada (medida de 65–72 caracteres por línea, capitular y citas destacadas), caja de "Fuente original" si existe, aviso fijo en posts de salud ("Contenido informativo, no sustituye consejo médico"), enlace a la otra versión de idioma, posts relacionados (misma categoría) y botones de compartir sin JS de terceros (enlaces web share/intent).
- Bloque "Últimas noticias" (3 posts) en la home, con la animación de entrada del prompt 03.
- RSS por idioma (`@astrojs/rss`) en `/noticias/rss.xml` y `/en/news/rss.xml`.
- `transition:name` en la portada y el título para la View Transition listado → post.

## Generador de tarjetas sociales (pieza clave)
Un script `scripts/social-card.ts` usando **Satori + @resvg/resvg-js + sharp** que, en build, genera para cada post:
- `/social/<lang>/<slug>.jpg`: **1080×1350 JPEG** (formato vertical de Instagram, calidad 88, < 1 MB y sRGB).
- `/og/<lang>/<slug>.png`: 1200×630 para Open Graph y X.

Diseño de la tarjeta, con la identidad del prompt 02: fondo papel crema o verde oscuro según la categoría, etiqueta de espécimen con la categoría, `instagramHook` (o el título) en serif grande, molécula de línea decorativa, personaje pequeño en una esquina, `highdoctor.foundation` en mono y fecha. Las fuentes se cargan como buffer desde `@fontsource`. **Sin imágenes de terceros.**

Hazlo como integración o endpoint estático de Astro para que esté disponible en `dist/` y se publique con la web, y para que la URL pública de la imagen exista cuando el workflow de Instagram la pida.

## Contenido inicial
Crea 3 posts de ejemplo **reales y verificables** de la propia fundación (p. ej. "Nace High Doctor Foundation", "Estaremos en Mary Jane Berlin" si Saf confirma la fecha) en ES y EN, con `instagram: 'off'` para que no se publiquen en IG al activar el prompt 08.

## Verificación
- Test unitario del schema: un post sin `source` con `author: 'bot'` tiene que fallar.
- Test que genera la tarjeta de un post de ejemplo y comprueba dimensiones, formato JPEG y peso < 1 MB. Mira la imagen generada y guárdala en `docs/capturas/05/`.
- Validador de RSS (por ejemplo `npx rss-validator` o la validación W3C con curl) sin errores.
- Commit `feat: blog de noticias multidioma con tarjetas sociales generadas` y push. Abre `/noticias/` y `/social/es/<slug>.jpg` en producción.
