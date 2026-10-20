# 08 — Reclamo automático en Instagram al publicar una noticia

## Objetivo
Cuando una noticia con `instagram: 'pending'` llega a producción (la escriba Saf o el bot), se publica sola en la cuenta de Instagram de High Doctor: la tarjeta generada (1080×1350) más un caption que invita a leerla en la web. Después el post queda marcado como `published` para no repetirse nunca.

## Por qué la API oficial
Los bots antiguos (`high-doctor-channel`) usan `instagrapi`, que imita la app móvil. Instagram lo detecta y bloquea o banea la cuenta. Se usa la **Instagram API with Instagram Login** (graph.instagram.com, permiso `instagram_business_content_publish`). Es gratis, no necesita página de Facebook y, como la app es tuya y tu cuenta tiene un rol en ella, funciona en modo desarrollo **sin revisión de Meta**. Documentación: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login y https://developers.facebook.com/docs/instagram-platform/content-publishing

## Paso 1 — Guía para Saf (lo que tiene que hacer a mano)
Escribe `docs/INSTAGRAM-SETUP.md` con pasos numerados y sin jerga, y **pídeselo a Saf** antes de seguir:
1. Pasar la cuenta de Instagram a **Profesional** (Business o Creator) si no lo es ya.
2. Entrar en developers.facebook.com → Crear app → caso de uso "Gestionar mensajes y contenido en Instagram" (o el nombre actual equivalente).
3. En *Instagram API with Instagram Login*, añadir la cuenta de Instagram como tester o rol y aceptarlo desde la propia app de Instagram.
4. Generar el token con los permisos `instagram_business_basic` y `instagram_business_content_publish` y copiar también el **Instagram User ID**.
5. Pasarle al agente el token y el ID **por un canal privado** (nunca en un commit). El agente los guarda con `gh secret set IG_ACCESS_TOKEN` e `IG_USER_ID`.
Antes de escribirla, comprueba con la documentación actual de Meta que los nombres de los menús siguen siendo esos, porque Meta los cambia a menudo.

## Paso 2 — Script `bot/src/instagram.ts`
1. Busca los posts con `instagram: 'pending'`, `draft: false` y fecha ≤ ahora. Si una noticia tiene ES y EN (mismo `translationKey`), publica **una sola vez**, en la versión ES (configurable con `IG_LANG`).
2. **Espera a que la imagen esté en línea**: haz un HEAD a `https://highdoctor.foundation/social/<lang>/<slug>.jpg` y reintenta con backoff hasta 5 minutos, porque el CDN de Pages tarda.
3. Crea el contenedor: `POST https://graph.instagram.com/<version>/<IG_USER_ID>/media` con `image_url` y `caption`.
4. Consulta `status_code` del contenedor hasta que sea `FINISHED` (con un timeout) y después `POST .../<IG_USER_ID>/media_publish` con `creation_id`.
5. Escribe `instagram: 'published'` + `instagramId` en el frontmatter de **todas** las versiones de idioma y haz commit (`instagram: publicado "<título>"`). Si falla, deja `pending`, anota el error en el summary y, tras 3 fallos seguidos del mismo post (contador en `bot/state/instagram.json`), pasa a `'off'` y avisa en el summary para no entrar en un bucle.
6. Respeta el límite de publicaciones por día de la API: consulta `content_publishing_limit` antes de publicar.

### Caption (`bot/src/caption.ts`)
- Línea 1: `instagramHook` o el título (gancho).
- 2–3 líneas a partir del `summary`.
- "Léela completa en highdoctor.foundation (enlace en la bio)", porque los enlaces del caption no son clicables en Instagram.
- Si es del bot: "Fuente: <nombre>".
- Hashtags: de 5 a 8, sacados de `bot/hashtags.yml` por categoría. **Lista blanca**: sólo hashtags educativos o científicos que se hayan comprobado a mano que no están restringidos (#cannabisresearch, #harmreduction, #cannabinoids…). Nada de hashtags de consumo o venta.
- Máximo 2.200 caracteres, con tests.

## Paso 3 — Workflows
- `.github/workflows/instagram.yml`: `on: workflow_run` de `deploy.yml` con `conclusion == success`, más `workflow_dispatch` con `dry_run`. `concurrency: instagram`. En `dry_run` imprime el caption y la URL de la imagen sin publicar.
- `.github/workflows/instagram-token-refresh.yml`: mensual (`schedule`) + `workflow_dispatch`. Llama a `GET https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=...` y guarda el nuevo token con `gh secret set`. Esto necesita un **PAT fine-grained** con permiso *Secrets: read & write* sólo en este repo, guardado como `GH_PAT_SECRETS`. Explícale a Saf cómo crearlo (gratis) en `docs/INSTAGRAM-SETUP.md`. Si el refresco falla, el job falla en rojo para que GitHub le mande un email.
- Ningún log puede imprimir el token (usa `::add-mask::`).

## Paso 4 — Botón del pánico
Una variable de repo `IG_ENABLED` (`gh variable set IG_ENABLED --body true`). Con `false`, el workflow sale sin hacer nada. Documenta en `docs/COMO-PUBLICAR.md` cómo pausar Instagram en un clic desde GitHub.

## Verificación
- Tests de `caption.ts` (longitud, hashtags y formato) y de la selección de posts (dedupe ES/EN, drafts y fechas futuras).
- `dry_run` en Actions: revisa la imagen y el caption en el summary.
- **Primera publicación real**: pide confirmación explícita a Saf antes de hacerla, porque es visible para el público. Después comprueba en la cuenta que el post existe, que el frontmatter quedó en `published` y que relanzar el workflow no duplica nada.
- Commit `feat: publicación automática del reclamo en Instagram` y push.
