# Contrato de contenido del blog

Todo lo que se publica en `/noticias/` (ES) y `/en/news/` (EN) es un fichero Markdown
en `src/content/news/<lang>/<slug>.md`. Da igual quién lo escriba —tú a mano, Pages
CMS (prompt 06), el bot (prompt 07)—: **este es el formato y el mismo flujo**.

- El esquema real está en `src/lib/news/schema.ts` y lo aplica `src/content.config.ts`.
  Si un post no cumple el contrato, **el build falla**.
- Los límites de longitud existen porque el mismo texto se usa en el listado, en
  `og:description` y en el pie de Instagram.

## Ruta y nombre del fichero

```
src/content/news/es/nace-high-doctor-foundation.md   →  /noticias/nace-high-doctor-foundation/
src/content/news/en/high-doctor-foundation-launches.md →  /en/news/high-doctor-foundation-launches/
```

- `<lang>`: `es` o `en`. El blog no existe en los otros seis idiomas: sus portadas
  muestran las noticias en EN y enlazan a `/en/news/`.
- `<slug>`: minúsculas, sin acentos ni signos, palabras separadas por `-`. El slug
  **no** se puede cambiar después de publicar (rompe enlaces y la imagen social).
- El slug en ES y en EN puede ser distinto: lo que une las dos versiones es
  `translationKey`.

## Campos

| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `title` | texto | sí | ≤ 90 caracteres |
| `summary` | texto | sí | ≤ 200 caracteres. Se usa en el listado, `og:description` y pie de Instagram |
| `date` | fecha `AAAA-MM-DD` | sí | Ordena listados y RSS |
| `lang` | `es` \| `en` | sí | Tiene que coincidir con la carpeta |
| `translationKey` | texto | sí | Mismo valor en la versión ES y EN del mismo post |
| `category` | enum | sí | `investigacion`, `salud`, `legislacion`, `cultura`, `fundacion`, `eventos` |
| `tags` | lista de textos | no (por defecto `[]`) | Etiquetas libres para el RSS |
| `cover` | imagen | no | Si falta, la portada es la tarjeta generada en el build |
| `coverAlt` | texto | no | Texto alternativo de la portada |
| `source` | `{ name, url }` | **sí si `author: bot`** | Enlace a la fuente original; el build falla si falta |
| `author` | texto | sí | `equipo`, `bot` o un nombre |
| `draft` | booleano | no (`false`) | En `astro build` no se publica; en `astro dev` sí se ve |
| `instagram` | enum | no (`pending`) | `off` no publica, `pending` entra en la cola del prompt 08, `published` ya está publicado |
| `instagramId` | texto | no | Id del post en Instagram (lo escribe el prompt 08) |
| `instagramHook` | texto | no | ≤ 80 caracteres. Frase gancho de la tarjeta; si falta se usa `title` |

### Reglas que el esquema impone y no se pueden saltar

1. `author: bot` **exige** `source`, y `source.url` tiene que ser una URL válida.
2. `title` ≤ 90, `summary` ≤ 200, `instagramHook` ≤ 80.
3. `category` y `lang` sólo admiten los valores del enum.
4. `instagram` sólo admite `off`, `pending` o `published`.

## Ejemplo completo de post

```markdown
---
title: 'Nace High Doctor Foundation'
summary: 'Una fundación independiente para la investigación, la educación y la divulgación científica sobre el cannabis y los cannabinoides.'
date: 2026-10-01
lang: es
translationKey: foundation-launch
category: fundacion
tags:
  - fundación
  - lanzamiento
  - red
source:
  name: 'High Doctor Foundation'
  url: 'https://highdoctor.foundation/'
author: equipo
draft: false
instagram: 'off'
instagramHook: 'Nace High Doctor Foundation'
---

High Doctor Foundation es una fundación independiente dedicada a la
investigación, la educación y la divulgación científica.

## Un subtítulo

Un párrafo normal con **negritas**, un [enlace](https://highdoctor.foundation/) y
una lista:

- primer punto
- segundo punto

> Una cita destacada que se pinta como cita editorial en el post.
```

Notas de formato:

- El cuerpo es Markdown estándar. Funcionan títulos (`##`, `###`), listas, citas,
  `**negritas**`, enlaces e imágenes locales.
- En ES y EN: `translationKey` idéntico, `date` la misma y `category` la misma.
  Así el post se enlaza con su versión traducida y los relacionados coinciden.
- El `instagram` por defecto (`pending`) hace que el post se publique en Instagram
  cuando se active el prompt 08. Para los posts de ejemplo se usa `off`.

## Qué genera el build para cada post

| Salida | Ruta | Formato |
|---|---|---|
| Página del post | `/noticias/<slug>/` · `/en/news/<slug>/` | HTML estático |
| Tarjeta social | `/social/<lang>/<slug>.jpg` | JPEG 1080×1350, calidad 88, sRGB, < 1 MB |
| Imagen Open Graph | `/og/<lang>/<slug>.png` | PNG 1200×630 |
| Feed | `/noticias/rss.xml` · `/en/news/rss.xml` | RSS 2.0 |

La tarjeta la dibuja `scripts/social-card.ts` (Satori + resvg + sharp) con
`instagramHook` (o `title`), la categoría, la fecha y la molécula de línea. **No
usa imágenes de terceros**: la identidad está en `SOCIAL_THEME`, `CATEGORY_PALETTES`
y `FONTS`, dentro de ese mismo fichero.

## Rutas del blog

| Qué | ES | EN |
|---|---|---|
| Listado | `/noticias/` | `/en/news/` |
| Página N (12 posts por página) | `/noticias/pagina/<n>/` | `/en/news/page/<n>/` |
| Categoría | `/noticias/categoria/<cat>/` | `/en/news/category/<cat>/` |
| Categoría + página | `/noticias/categoria/<cat>/pagina/<n>/` | `/en/news/category/<cat>/page/<n>/` |
| Post | `/noticias/<slug>/` | `/en/news/<slug>/` |
| RSS | `/noticias/rss.xml` | `/en/news/rss.xml` |

Decisiones y porqué:

- **ES vive en `/noticias/`, no en `/es/noticias/`.** Es la ruta que pide el prompt
  05 y queda corta; la portada ES sigue en `/es/`. El selector de idioma del blog
  lleva del post ES a su versión EN y viceversa.
- **EN vive en `/en/news/`** aunque el inglés sea el idioma por defecto en `/`. Así
  el blog EN no choca con la portada y la ruta es explícita.
- **`<cat>` mantiene el valor del enum en los dos idiomas** (`/categoria/salud/`,
  `/category/salud/`): un único slug por categoría evita mantenimiento doble.
- **Los otros seis idiomas** no generan blog. Su portada muestra las tres últimas
  noticias en EN, con un aviso en su idioma ("las noticias se publican en inglés"),
  y todos los enlaces llevan a `/en/news/`.

## Bloque "Últimas noticias" de la portada

`src/components/news/LatestNews.astro` pinta las tres noticias más recientes:

- EN y ES muestran las noticias de su propio idioma.
- `de`, `fr`, `it`, `pt`, `nl` y `pl` muestran las noticias en EN y el aviso de idioma.

Es la decisión de `docs/PLAN.md`: no se generan ocho versiones de cada noticia.

## Posts de salud

Si `category: salud`, el post muestra siempre el aviso:

> Contenido informativo, no sustituye consejo médico.

No es descartable y no depende del autor. Con `author: bot` el post además tiene
que citar la fuente original (`source`), que se pinta en una caja al final del
artículo.

## Añadir una noticia (a mano)

1. Copia un post existente del idioma que toque.
2. Cambia `title`, `summary`, `date`, `translationKey` y el slug del fichero.
3. Escribe el cuerpo en Markdown.
4. `npm run build` en local: si el contrato no se cumple, el build falla y dice qué
   campo.
5. Commit y push: el workflow publica la web, la tarjeta social y la imagen OG.
6. Si quieres que se publique en Instagram cuando el prompt 08 esté activo, deja
   `instagram: 'pending'`. Si no, `instagram: 'off'`.

## Posts de ejemplo incluidos (todos `instagram: 'off'`)

| `translationKey` | ES | EN | Categoría |
|---|---|---|---|
| `foundation-launch` | `nace-high-doctor-foundation` | `high-doctor-foundation-launches` | `fundacion` |
| `cannabinoid-research-context` | `investigacion-cannabinoides-contexto` | `why-cannabinoid-research-needs-context` | `investigacion` |
| `reading-cannabis-health-news` | `leer-noticias-salud-cannabis` | `reading-cannabis-health-news` | `salud` |

No incluyen cifras ni datos no comprobables: son textos de presentación y método de
la fundación. Las fechas son las de publicación del blog y se pueden ajustar cuando
Saf confirme el calendario real.
