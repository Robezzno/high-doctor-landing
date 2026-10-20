# Notas internas — publicación manual con Pages CMS (prompt 06)

Rama: `feat/cms`. **Sin commit**: lo hace el agente principal.
Este fichero es para el traspaso; el texto que hay al final está listo para pegar
en `docs/TAREAS.md`.

## Qué se ha hecho

| Fichero | Para qué |
|---|---|
| `.pages.yml` | Configuración de Pages CMS: media + dos colecciones (ES/EN) con el contrato de `docs/CONTENIDO.md`. |
| `docs/COMO-PUBLICAR.md` | Guía para Saf, sin código: entrar, crear, subir foto, Instagram, borradores, quitar una noticia, pausar Instagram. |
| `.github/workflows/content-check.yml` | En PRs y pushes que toquen `src/content/**`: `astro check` + `npm run build` y, si falla, comentario automático en el PR o en el commit. |
| `src/assets/news/.gitkeep` | Carpeta de destino de las imágenes subidas desde el CMS. Sin ella el repo no tiene dónde escribir la primera foto (Pages CMS usa `.gitkeep` para crear carpetas: es su convención). |

No se ha tocado `src/styles`, `src/components`, `src/content.config.ts` ni
`src/lib/news/**`: el esquema real ya valida todo lo que escribe el CMS.

## Cómo resuelve la imagen (lo importante del prompt)

- `media.input: src/assets/news` → dónde se guardan los ficheros.
- `media.output: ../../../assets/news` → lo que Pages CMS escribe en el frontmatter.
  Es relativo al `.md`: `src/content/news/es/x.md` → `src/assets/news/foto.jpg`.
  Las dos carpetas de idioma están a la misma profundidad, así que vale la misma
  ruta para ES y EN.
- `cover` usa `image()` de Astro, así que la imagen entra en el pipeline de
  optimización y **no** se sirve en bruto.

Verificado en local (prueba descrita abajo): la portada acaba como
`/_astro/logo-character.<hash>.webp` con `srcset` de 480/760/888 px (+ AVIF), y en
`dist/` no queda ninguna copia del original. Las imágenes insertadas **dentro del
texto** con el editor también se optimizan (Astro procesa las imágenes Markdown
relativas), así que el campo de texto puede llevar fotos sin romper nada.

## Simulación de un guardado del CMS

Se creó a mano `src/content/news/es/2026-10-21-prueba-guardado-pages-cms.md` con el
frontmatter en el orden que genera Pages CMS, `cover:
../../../assets/news/ejemplo-portada-cms.png` y una imagen copiada en la carpeta de
media:

- `npm run build` → OK, 30 páginas (29 + la de prueba).
- Página generada: `/noticias/2026-10-21-prueba-guardado-pages-cms/`, tarjeta social
  `/social/es/…jpg` e imagen OG `/og/es/…png`, sin errores.
- Portada optimizada: `srcset` con webp de 480/760/888 px y variantes AVIF, `width`
  y `height` calculados, `alt` desde `coverAlt`. Cero ficheros en bruto en `dist/`.
- Prueba negativa: un post con `summary` de más de 200 caracteres (además `draft:
  true`) hace fallar el build con `EXIT=1` y un error que nombra el campo y el
  fichero (`InvalidContentEntryDataError … summary: Too big`). Confirma dos cosas:
  los borradores también se validan y el aviso del workflow es accionable.

El post y la imagen de prueba se borraron al terminar. Queda sólo
`src/assets/news/.gitkeep`.

## Decisiones que conviene revisar

1. **`settings.content.merge: true`**: al guardar desde el CMS se conservan las
   claves del frontmatter que no están en el esquema (`instagramId`, `source`,
   `published`). Sin esto, editar un post del bot borraría su `source` y el build
   rompería por contrato (`author: bot` exige `source`). Efecto secundario
   comprobado en el código de Pages CMS: vaciar un campo en el editor escribe `""`
   y el guardado lo elimina, así que quitar la foto o la frase de Instagram
   funciona bien.
2. **`instagram` tiene tres opciones, no dos**: `pending` («Publicar en
   Instagram»), `off` («No publicar») y `published` («Ya publicado (lo marca el
   sistema, no lo cambies)»). Sin la tercera, un post ya publicado en Instagram
   sería imposible de guardar desde el CMS (el valor no estaría en la lista).
3. **`lang` es un `select` oculto con un solo valor** (`es` en la colección ES, `en`
   en la EN). Lo rellena el CMS y no se puede romper: el contrato exige que
   coincida con la carpeta.
4. **`author` es un select `equipo` / `bot`**, no texto libre: el contrato admite
   nombres, pero el 99% de las veces es uno de los dos y así no se rompe la
   validación.
5. **`translationKey` con `pattern` `^[a-z0-9-]+$`**: evita claves con espacios o
   acentos que romperían el enlazado ES/EN.
6. **`filename.field: create`**: Saf ve el nombre del fichero al crear (puede
   recortarlo) y no puede renombrarlo después por accidente… salvo con el menú ⋮
   (renombrar sigue permitido; la guía avisa de que cambia la URL).
7. **`content-check.yml` instala también las dependencias de `bot/`** (paso
   `working-directory: bot`): `astro check` analiza todo el repo y sin ellas da 3
   errores falsos (`jsdom`, `@mozilla/readability`, `rss-parser`). Cuesta ~13 s. La
   alternativa limpia sería añadir `bot` al `exclude` de `tsconfig.json`, que
   estaba fuera del alcance de esta tarea.
8. **`content-check.yml` tiene `contents: write` y `pull-requests: write`** sólo
   para poder comentar. Si el token llega en modo lectura (PR desde un fork), el
   comentario falla con un `::warning::` y el workflow no se rompe por eso.

## Pendiente

- **Prueba real desde el móvil** (Saf): instalar la app de Pages CMS en GitHub,
  entrar en `Robezzno/high-doctor-landing`, crear una noticia de prueba, subir una
  foto y guardar. Comprobar que aparece en `/noticias/` en 1–2 min y borrarla
  después. Sin esa prueba, todo lo de arriba está verificado en local, no en el
  editor real.
- **Pausar Instagram**: la variable `IG_ENABLED` la crea el prompt 08.
  `docs/COMO-PUBLICAR.md` ya explica dónde estará.
- **Commit y push** (`feat: publicación manual con Pages CMS` y actualizar
  `docs/TAREAS.md`): los hace el agente principal.

## Dudas para Saf

1. ¿La cuenta de GitHub que usará es `Robezzno`? La guía lo da por hecho.
2. ¿Le vale que las noticias nuevas se guarden con prefijo de fecha
   (`2026-10-21-titular.md`)? Los tres posts actuales no lo llevan y su URL no
   cambia; sólo cambia el de las noticias nuevas.
3. ¿Quiere que las noticias creadas desde el CMS se publiquen directamente en
   `main` (lo actual) o prefiere revisar antes con un PR? El CMS puede abrir PRs,
   pero se configura en la app, no en `.pages.yml`.

## Texto para `docs/TAREAS.md`

En «Hecho (además)»:

> - 2026-10-21: prompt 06 — publicación manual con Pages CMS: `.pages.yml` (media
>   en `src/assets/news` optimizada por Astro + colecciones ES/EN con el contrato de
>   `docs/CONTENIDO.md`), guía `docs/COMO-PUBLICAR.md` y workflow
>   `content-check.yml` (astro check + build en PRs y pushes que toquen
>   `src/content/**`, con comentario automático si falla). Verificado con un
>   guardado simulado del CMS; falta la prueba real desde el móvil.

En «Pendiente de Saf»:

> - Probar Pages CMS desde el móvil: instalar la app en GitHub
>   (`Robezzno/high-doctor-landing`), crear una noticia de prueba con foto y
>   borrarla. Guía en `docs/COMO-PUBLICAR.md` (prompt 06).
