# Contrato de contenido del blog

El blog de noticias es el punto donde se juntan tres piezas: los posts escritos
a mano (Pages CMS), el bot de noticias (`bot/`) y el reclamo de Instagram. Para
que las tres encajen sin tocar código, **el formato de los posts es un contrato**
y este documento es la referencia.

Si algo de aquí cambia, cambia en tres sitios: `src/content.config.ts`, este
documento y el prompt del bot (`bot/src/write.ts`).

## Dónde vive un post

```
src/content/news/<lang>/<slug>.md      # lang = es | en
```

- El **slug** es el nombre del fichero, en minúsculas y con guiones. El bot lo
  calcula a partir del título ES (`bot/src/publish.ts` → `slugify`).
- El **`translationKey`** une la versión ES y la EN del mismo post. Por
  convenio es igual al slug, así que los dos ficheros se llaman igual y sólo
  cambia la carpeta: `news/es/<slug>.md` y `news/en/<slug>.md`.
- Los otros seis idiomas no se traducen: muestran la versión EN.

## Schema Zod (el contrato)

Este es el schema de la colección `news` en `src/content.config.ts`:

```ts
import { defineCollection, z } from 'astro:content';

const CATEGORIES = [
  'investigacion',
  'salud',
  'legislacion',
  'cultura',
  'fundacion',
  'eventos',
] as const;

const news = defineCollection({
  type: 'content',
  schema: ({ image }) =>
    z
      .object({
        title: z.string().max(90),
        summary: z.string().max(200),
        date: z.coerce.date(),
        lang: z.enum(['es', 'en']),
        translationKey: z.string().min(1),
        category: z.enum(CATEGORIES),
        tags: z.array(z.string()).default([]),
        cover: image().optional(),
        coverAlt: z.string().optional(),
        source: z
          .object({
            name: z.string().min(1),
            url: z.string().url(),
          })
          .optional(),
        author: z.string().default('equipo'), // 'bot' | 'equipo' | nombre
        draft: z.boolean().default(false),
        instagram: z.enum(['off', 'pending', 'published']).default('pending'),
        instagramId: z.string().optional(),
        instagramHook: z.string().max(80).optional(),
      })
      .refine((post) => post.author !== 'bot' || post.source !== undefined, {
        message: "source es obligatorio cuando author = 'bot'",
        path: ['source'],
      }),
});

export const collections = { news };
```

### Campo a campo

| Campo | Tipo | Obligatorio | Para qué sirve |
|---|---|---|---|
| `title` | string ≤ 90 | sí | Titular del post y de la tarjeta social. |
| `summary` | string ≤ 200 | sí | Listados, `og:description` y pie de la imagen. |
| `date` | fecha | sí | Orden del listado, RSS y fecha de la tarjeta. |
| `lang` | `es` \| `en` | sí | Idioma del fichero. Debe coincidir con su carpeta. |
| `translationKey` | string | sí | Une ES y EN del mismo post. Igual al slug. |
| `category` | `investigacion` \| `salud` \| `legislacion` \| `cultura` \| `fundacion` \| `eventos` | sí | Filtro del listado y color de la tarjeta. |
| `tags` | string[] | no (por defecto `[]`) | Temas libres. El bot pone entre 2 y 6. |
| `cover` | imagen | no | Si falta, se usa la tarjeta generada. |
| `coverAlt` | string | no | Texto alternativo de la portada. |
| `source` | `{ name, url }` | obligatorio si `author: bot` | Caja de "Fuente original" y trazabilidad. |
| `author` | `bot` \| `equipo` \| nombre | sí | Quién firma. El bot siempre pone `bot`. |
| `draft` | boolean (por defecto `false`) | no | Un borrador no se publica ni sale en IG. |
| `instagram` | `off` \| `pending` \| `published` (por defecto `pending`) | no | Estado del reclamo en Instagram. |
| `instagramId` | string | no | Lo rellena el workflow de Instagram al publicar. |
| `instagramHook` | string ≤ 80 | no | Frase gancho de la tarjeta. Si falta, se usa `title`. |

## Ejemplo de post completo

`src/content/news/es/ensayo-cbd-dolor-cronico.md`:

```markdown
---
title: Un ensayo español mide el efecto del CBD en el dolor crónico
summary: Un ensayo clínico español publica resultados preliminares sobre CBD y dolor crónico en pacientes con fibromialgia.
date: 2026-10-20T08:30:00.000Z
lang: es
translationKey: ensayo-cbd-dolor-cronico
category: investigacion
tags:
  - cbd
  - dolor
  - investigacion
source:
  name: Cáñamo
  url: https://canamo.net/noticia/ensayo-cbd-dolor
author: bot
draft: false
instagram: pending
instagramHook: Un ensayo español mide el CBD en el dolor crónico
---

## Qué ha pasado

Un equipo de investigación español ha publicado los resultados preliminares de
un ensayo clínico que mide el efecto del cannabidiol en personas con dolor
crónico. El trabajo, recogido por
[Cáñamo](https://canamo.net/noticia/ensayo-cbd-dolor), incluye pacientes con
fibromialgia y un seguimiento de doce semanas.

## Por qué importa

Es uno de los primeros ensayos europeos que mide dolor crónico con seguimiento
largo y criterios clínicos claros. Para los pacientes aporta algo distinto a las
promesas comerciales: datos con método.

## Contexto

La evidencia previa era sobre todo observacional y con muestras pequeñas. Este
trabajo sigue la línea de los ensayos aleatorizados que se han hecho en otros
países europeos con cannabinoides y dolor neuropático.

## Qué no sabemos todavía

La muestra es reducida y los autores piden cautela antes de generalizar.
Tampoco se ha medido el efecto a largo plazo ni la comparación con tratamientos
convencionales.
```

`src/content/news/en/ensayo-cbd-dolor-cronico.md`:

```markdown
---
title: A Spanish trial measures CBD against chronic pain
summary: A Spanish clinical trial publishes preliminary results on CBD and chronic pain in patients with fibromyalgia.
date: 2026-10-20T08:30:00.000Z
lang: en
translationKey: ensayo-cbd-dolor-cronico
category: investigacion
tags:
  - cbd
  - pain
  - research
source:
  name: Cáñamo
  url: https://canamo.net/noticia/ensayo-cbd-dolor
author: bot
draft: false
instagram: pending
instagramHook: A Spanish trial measures CBD against chronic pain
---

## What happened

A Spanish research team has published preliminary results from a clinical trial
measuring the effect of cannabidiol on people living with chronic pain. The
work, reported by [Cáñamo](https://canamo.net/noticia/ensayo-cbd-dolor),
includes patients with fibromyalgia and twelve weeks of follow-up.

## Why it matters

It is one of the first European trials to measure chronic pain with long
follow-up and clear clinical criteria. For patients it offers something
different from commercial promises: data with method.

## Context

Previous evidence was mostly observational and based on small samples. This work
follows the line of randomised trials carried out in other European countries
with cannabinoids and neuropathic pain.

## What we do not know yet

The sample is small and the authors themselves ask for caution before
generalising. Long-term effects and comparisons with conventional treatments
have not been measured either.
```

## Reglas de redacción (manual y bot)

Valen para lo que escriba el equipo y para lo que escriba el bot:

1. **Voz de la fundación**: divulgativa, rigurosa, cercana y sobria. Sin
   sensacionalismo, sin emojis y sin mayúsculas gritadas.
2. **300–500 palabras** por idioma, con esta estructura: qué ha pasado → por qué
   importa → contexto → qué no sabemos todavía.
3. **Sin dosis ni consejos médicos.** Sin pautas de consumo y sin recomendar
   probar, comprar o cultivar.
4. **Sin promover el consumo.** Nada de precios, ofertas, cepas como producto ni
   recetas de consumo.
5. **Cita la fuente** dentro del texto, con enlace, una sola vez.
6. **No inventes datos, cifras, fechas, nombres ni citas.** Si el original no lo
   dice, no se escribe.
7. **Resumen propio, nunca copia.** Ni frases ni secuencias largas del original.
8. Los posts de salud llevan un aviso fijo: _Contenido informativo. No sustituye
   el consejo médico._ Lo pinta la plantilla del post (prompt 05), así que no se
   escribe en el markdown.

## Lo que devuelve el bot

El bot pide al LLM exactamente este JSON (validado con Zod en
`bot/src/write.ts`; si no valida, reintenta una vez y, si vuelve a fallar, no
publica):

```json
{
  "es": {
    "title": "≤ 90 caracteres",
    "summary": "≤ 200 caracteres",
    "body": "markdown de 300-500 palabras, sin H1",
    "instagramHook": "≤ 80 caracteres",
    "tags": ["2 a 6 etiquetas", "en minúsculas"]
  },
  "en": {
    "title": "≤ 90 caracteres",
    "summary": "≤ 200 caracteres",
    "body": "markdown de 300-500 palabras, sin H1",
    "instagramHook": "≤ 80 caracteres",
    "tags": ["2 a 6 etiquetas", "en minúsculas"]
  },
  "category": "investigacion | salud | legislacion | cultura | fundacion | eventos"
}
```

Con ese JSON, `bot/src/publish.ts` genera el frontmatter que has visto arriba:
mismo `translationKey` en ES y EN, `author: 'bot'`, `source` relleno con la
fuente de la noticia e `instagram: 'pending'`. El estado del bot se guarda en
`bot/state/seen.json` y se commitea junto con el post, así que relanzar el bot no
duplica noticias.

## Verificación rápida

- Un post con `author: bot` y sin `source` **falla** el schema (hay test en
  `src/content.config` del prompt 05).
- Los tests del bot comprueban la forma del JSON: `cd bot && npm test`.
