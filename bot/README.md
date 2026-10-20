# Bot de noticias

Busca noticias de cannabis en fuentes RSS fiables, elige **una**, escribe un
post original en ES + EN y lo publica (o lo deja en un PR para revisar). Sin
servidor y sin coste: corre en GitHub Actions
(`.github/workflows/news-bot.yml`).

El formato del post es el contrato de `docs/CONTENIDO.md`. Cualquier cambio ahí
tiene que replicarse en `src/write.ts` (prompt) y en `src/publish.ts`
(frontmatter).

## Cómo funciona

```
sources.yml ──► fetch.ts ──► filter.ts ──► article.ts ──► write.ts ──► publish.ts
   fuentes       RSS/PubMed   72 h + vetos   Readability     LLM + Zod     .md ES+EN
                              + deduplicado  (sin paywalls)   + anti-copia  commit o PR
```

1. **`fetch.ts`** lee las fuentes de `sources.yml` (`rss` con `rss-parser`,
   `pubmed` con la API pública E-utilities) y normaliza a `FeedItem`.
2. **`filter.ts`** descarta lo viejo (> 72 h), los temas vetados (`config.yml`),
   lo ya visto (`state/seen.json`), lo que se parece a un post existente
   (trigramas, umbral 0,6) y lo que no llega a la puntuación mínima. Elige **una**
   noticia; si nada pasa el filtro, no publica nada.
3. **`article.ts`** extrae el texto del artículo con `@mozilla/readability`.
   Respeta `robots.txt` y no intenta saltarse paywalls: si hay 401/402/403,
   escribe sólo con el título y el resumen del feed.
4. **`write.ts`** pide el JSON al LLM, lo valida con Zod (1 reintento) y comprueba
   que no copie: si más del 15 % de los 8-gramas coinciden con el original, se
   reescribe una vez y, si vuelve a pasar, se descarta la noticia.
5. **`publish.ts`** escribe `src/content/news/{es,en}/<slug>.md`, actualiza
   `state/seen.json` en el mismo commit y:
   - `BOT_MODE=review` → rama `noticia-bot/<slug>` + PR con la etiqueta
     `noticia-bot`.
   - `BOT_MODE=publish` → commit directo a `main` (`noticia: <título>`), autor
     `Robezzno <robezzno@gmail.com>`, sin atribución a IA. Después lanza
     `gh workflow run deploy.yml` porque un push con `GITHUB_TOKEN` no dispara
     otros workflows.

## Uso local

```bash
cd bot
npm install
npm test            # vitest: filtro, validador del JSON, contrato del post
npm run dry-run     # genera el post y lo imprime, sin escribir nada
```

`npm run dry-run` necesita un token para el LLM:

```bash
GITHUB_TOKEN=$(gh auth token) DRY_RUN=1 npm run run
```

Variables de entorno:

| Variable | Por defecto | Para qué |
|---|---|---|
| `BOT_MODE` | `review` | `review` (PR) o `publish` (commit a main). |
| `DRY_RUN` | `0` | `1` imprime el post y no escribe ni commitea. |
| `LLM_PROVIDER` | `github-models` | `github-models` (gratis) o `anthropic` (de pago). |
| `LLM_MODEL` | `openai/gpt-4o-mini` | Modelo del proveedor elegido. |
| `GITHUB_TOKEN` | — | Lo pone Actions (`models: read`). También sirve en local. |
| `GH_TOKEN` | — | Para `gh pr create`, etiquetas y `gh workflow run`. |
| `ANTHROPIC_API_KEY` | — | **No configurada.** Sólo si se aprueba el LLM de pago. |
| `GITHUB_STEP_SUMMARY` | — | Lo pone Actions: ahí se imprime el post en dry run. |

### Proveedores de LLM

- **`github-models`** (por defecto): gratis con el `GITHUB_TOKEN` del workflow y
  límite diario de sobra para 1–3 noticias al día. Endpoint
  `https://models.github.ai/inference/chat/completions`.
- **`anthropic`**: implementado en `src/llm.ts` pero **sin configurar**. Es de
  pago (céntimos al mes con este volumen) y no se activa sin el OK de Saf
  (`docs/PLAN.md` §4). Para usarlo haría falta `ANTHROPIC_API_KEY` como secret y
  `LLM_PROVIDER=anthropic`.

## Fuentes

`bot/sources.yml` tiene 11 fuentes, todas comprobadas con `curl`
(código 200 + XML con `<item>`) el 2026-10-20. Las descartadas:

| Fuente | Motivo |
|---|---|
| EUDA / EMCDDA | 403 de Cloudflare con `curl` |
| MDPI | 403 de Cloudflare |
| Journal of Cannabis Research (BMC) | ya no sirve RSS |
| Cannabis and Cannabinoid Research (Liebert) | feed congelado en 2015 |
| Energy Control | challenge de Cloudflare |
| Cannabislaw.report, Drugreporter, Cannabis Culture | 403 |

PubMed no permite RSS de una búsqueda arbitraria (hace falta una búsqueda
guardada en MyNCBI), así que se usa la API E-utilities: gratis, sin clave y con
los abstracts incluidos.

Para añadir una fuente: cópiala en `sources.yml` y compruébala antes con
`curl -sL -o /dev/null -w "%{http_code}\n" <url>` (tiene que dar 200 y devolver
`<rss`, `<feed` o `<rdf:RDF`).

## Horario y cambio de hora

Cron de GitHub Actions en UTC; Madrid cambia de hora:

| Época | 08:30 en Madrid | Cron |
|---|---|---|
| Verano (CEST, UTC+2) | 06:30 UTC | `30 6 * * 1,3,5` |
| Invierno (CET, UTC+1) | 07:30 UTC | `30 7 * * 1,3,5` |

Los dos crons están activos y un paso del workflow ("Comprobar hora de Madrid")
deja pasar sólo el que cae entre las 08:00 y las 08:44 locales. Así el bot corre
lunes, miércoles y viernes a las 08:30 de Madrid todo el año, sin duplicar
ejecuciones ni tener que tocar el cron dos veces al año.

## Aprobar una noticia desde el móvil (Saf)

1. Abre la app de GitHub y entra en el repo → pestaña **Pull requests**: la
   noticia nueva está con la etiqueta `noticia-bot`.
2. Toca **Files changed** para leer el post en ES y EN (y la fuente en el
   frontmatter).
3. **Merge pull request** si te convence; **Close** si no. Al mergear se publica
   en la web y el post queda pendiente de Instagram.

## Estado y idempotencia

`state/seen.json` guarda la URL, el título y la fecha de cada noticia publicada,
y se commitea junto con los posts. Si el workflow se relanza, la noticia no se
duplica. En modo `review` el estado vive en la rama del PR: hasta que se mergea,
un relanzamiento no la ve (por eso hay `concurrency: news-bot`, para que no se
solapen ejecuciones).

## Tests

```bash
cd bot && npm test
```

- `tests/filter.test.ts`: frescura, vetos, deduplicado por URL canónica y por
  similitud de título, puntuación y umbral.
- `tests/write.test.ts`: validador del JSON del LLM con fixtures, reintentos y
  control anti-copia de 8-gramas.
- `tests/publish.test.ts`: contrato del frontmatter (`author: bot`, `source`,
  `instagram: pending`, mismo `translationKey`) y `state/seen.json`.

---

# Reclamo en Instagram

Cuando una noticia tiene `instagram: 'pending'` en el frontmatter, este flujo la
publica sola en la cuenta de Instagram: la tarjeta 1080×1350 que genera el build
(`/social/<lang>/<slug>.jpg`) más un caption que invita a leerla en la web. Lo
escribe quien lo escriba el post (Saf, Pages CMS o el bot): sólo mira el
frontmatter.

```
deploy.yml OK ──► instagram.yml ──► instagram.ts ──► graph.instagram.com
                                    selección        media → media_publish
                                    caption          commit: instagram: publicado
```

1. **`src/instagram.ts`** elige los posts con `instagram: 'pending'`,
   `draft: false` y fecha ≤ ahora. Si un post tiene ES y EN (mismo
   `translationKey`), publica **una sola vez**, en el idioma de `IG_LANG`.
2. Espera a que la tarjeta esté en línea (HEAD con reintentos y backoff, hasta 5
   minutos): el CDN de Pages tarda.
3. Consulta `content_publishing_limit`, crea el contenedor
   (`POST /<IG_USER_ID>/media` con `image_url` + `caption`), espera a que el
   `status_code` sea `FINISHED` y publica (`POST .../media_publish`).
4. Escribe `instagram: 'published'` + `instagramId` en **todas** las versiones de
   idioma y commitea (`instagram: publicado "<título>"`, autor
   `Robezzno <robezzno@gmail.com>`).
5. Si falla, el post sigue en `pending` y el motivo va al resumen. Tras **3
   fallos seguidos** del mismo post (`state/instagram.json`) pasa a
   `instagram: 'off'` para no entrar en bucle.

**`src/caption.ts`** arma el pie de foto: gancho (`instagramHook` o título),
2–3 frases del `summary`, "Léela completa en highdoctor.foundation (enlace en la
bio)", "Fuente: <nombre>" si el post es del bot, y 5–8 hashtags de
`bot/hashtags.yml` (lista blanca por categoría, sólo educativos o científicos).
Máximo 2200 caracteres.

| Variable | Por defecto | Para qué |
|---|---|---|
| `IG_ENABLED` | — | `false` apaga el flujo entero (variable de repo, no secreto). |
| `IG_ACCESS_TOKEN` | — | Token de la API de Instagram (secreto). Caduca a los 60 días. |
| `IG_USER_ID` | — | Instagram User ID de la cuenta (secreto). |
| `IG_LANG` | `es` | Idioma del caption y de la tarjeta: `es` o `en`. |
| `IG_API_VERSION` | `v26.0` | Versión de la API de Meta. |
| `IG_MAX_PER_RUN` | `1` | Posts publicados por ejecución (el resto queda en cola). |
| `DRY_RUN` | `0` | `1` imprime caption y URL sin publicar ni escribir nada. |

Puesta en marcha (cuenta profesional, app de Meta, token y PAT del refresco):
`docs/INSTAGRAM-SETUP.md`. Pausar Instagram en un clic: `docs/COMO-PUBLICAR.md`.

Tokens y límites (verificado el 2026-10-20 en la documentación de Meta):

- El token de usuario de Instagram dura **60 días**;
  `instagram-token-refresh.yml` lo renueva cada mes con
  `GET /refresh_access_token?grant_type=ig_refresh_token` y lo guarda con
  `gh secret set` usando el PAT `GH_PAT_SECRETS`. Si el refresco falla, el job se
  pone en rojo. Ningún log imprime el token (`::add-mask::`).
- Instagram admite **100 publicaciones por API cada 24 h** y sólo JPG.
- El flujo **no** usa `instagrapi`: Instagram detecta el acceso no oficial y
  bloquea la cuenta.

## Tests del reclamo de Instagram

- `tests/caption.test.ts`: longitud (≤ 2200), 5–8 hashtags de la lista blanca,
  formato (gancho, CTA, fuente sólo si es del bot) y rechazo de hashtags vetados.
- `tests/instagram.test.ts`: selección (dedupe ES/EN, borradores, fechas
  futuras, `off`/`published`), reescritura del frontmatter en todas las
  versiones, commit esperado, dry run, cupo agotado y contador de 3 fallos.
  Todo con una API falsa: **ningún test llama a Meta**.
- Fixtures: `tests/fixtures/instagram/{es,en}/`.

Prueba manual sin publicar:

```bash
cd bot
npm run instagram:dry-run          # imprime caption y URL de la imagen
```
