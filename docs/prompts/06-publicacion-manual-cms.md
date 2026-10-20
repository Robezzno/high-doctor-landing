# 06 — Publicación manual con Pages CMS

## Objetivo
Que Saf pueda escribir y publicar una noticia **desde el móvil o el PC sin tocar código**, con editor visual, subida de imágenes y la opción de mandarla o no a Instagram.

## Tareas
1. Crea `.pages.yml` en la raíz (documentación: https://pagescms.org/docs y la guía de Astro https://docs.astro.build/en/guides/cms/pages-cms/):
   - `media`: `input: src/assets/news` y `output: ../../assets/news` (ajusta las rutas para que `image()` del schema las resuelva).
   - Dos colecciones: **"Noticias (Español)"** → `src/content/news/es` y **"News (English)"** → `src/content/news/en`, con campos que reflejen exactamente el contrato de `docs/CONTENIDO.md`:
     - `title`, `summary` (textarea con límite), `date` (por defecto hoy), `category` (select), `tags`, `cover` + `coverAlt`, `body` (rich-text o markdown).
     - `instagram` como select con etiquetas claras: "Publicar en Instagram" (`pending`), "No publicar" (`off`). Oculta `published` e `instagramId`, que gestiona el workflow.
     - `instagramHook` con una ayuda: "Frase corta que saldrá en la imagen de Instagram (máx. 80)".
     - `author` por defecto `equipo`, `draft` como switch "Borrador".
     - `translationKey` con una descripción clara ("pon el mismo valor en la versión ES y EN").
   - Plantilla de nombre de archivo: `{year}-{month}-{day}-{primary}`.
2. Asegúrate de que una imagen subida desde Pages CMS acaba optimizada por `<Image>` de Astro (no servida en bruto).
3. **Guía para Saf** en `docs/COMO-PUBLICAR.md`, corta y con pasos numerados, pensada para alguien que no programa:
   - Entrar en https://app.pagescms.org con GitHub y elegir el repo `high-doctor-landing` (sólo la primera vez).
   - Crear una noticia, subir la foto y elegir si va a Instagram.
   - Guardar = se publica en 1–2 minutos. Cómo dejarla como borrador.
   - Qué hacer si quiere quitar una noticia.
4. Optimización: un workflow ligero `content-check.yml` que, en cada PR o push que toque `src/content/**`, valide el schema (`astro check` + `astro build`). Así se evita que un error en el CMS rompa el deploy, y si falla deja un comentario claro en el commit.

## Verificación
- Simula un guardado del CMS: crea a mano un `.md` como lo generaría Pages CMS (mismo frontmatter, imagen en la ruta de media) y comprueba que el build lo acepta y lo pinta bien.
- Si Saf está disponible, pídele que haga la prueba real desde el móvil. Si no, apunta en `docs/TAREAS.md` que la prueba real en el CMS está pendiente.
- Commit `feat: publicación manual con Pages CMS` y push.
