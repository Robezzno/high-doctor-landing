# High Doctor Foundation — highdoctor.foundation

Web estática de la fundación (divulgación sobre cannabis con evidencia científica): Astro 7, 8 idiomas
(en en `/`, es/de/fr/it/pt/nl/pl con prefijo), blog de noticias ES/EN y flujo de Instagram. Hosting: GitHub Pages.
Repo **público** `Robezzno/high-doctor-landing`. El publicador con IA vive aparte, en el repo privado `Robezzno/high-doctor-publicador`.

## Ramas
- `main` = producción. `rediseno-v3` ya está mergeada (a 2026-11-21 apunta al mismo commit que `main`).
- `rediseno`, `feat/*`, `wip/*`: historial de rediseños y prompts anteriores; no se basan en ellas tareas nuevas.

## Ejecutar y probar (Node 22)
```bash
npm ci                    # raíz (web)
npm run dev               # servidor local
npm run build             # i18n:check + astro build → dist/ (≈2 min, 65 páginas)
npm test                  # vitest: tests de src/, scripts/ y bot/ (139)
npm run check             # astro check (tipos); necesita también `cd bot && npm ci`
npm run qa:links          # crawler de enlaces internos sobre dist/
npm run test:e2e          # Playwright + axe (41), requiere build previo
npm run i18n:check        # las 8 i18n/*.json con las mismas claves
cd bot && npm ci && npm test && npm run typecheck   # bot: 97 tests
```
- e2e: en Astro 7 `npm run preview` se va a segundo plano y Playwright cree que «sale antes de tiempo».
  Arráncalo antes (`npm run preview -- --port 4321 --host 127.0.0.1`, tarda unos segundos), lanza
  `npm run test:e2e` (lo reutiliza) y páralo con `npx astro preview stop`.
- **Los e2e sobrescriben las capturas versionadas** de `docs/capturas/09/`. Si no buscabas capturas nuevas:
  `git checkout -- docs/capturas/09`.
- `npm run qa` = build + e2e + qa:links. CI de PR: `.github/workflows/ci.yml` (check, test, build, qa:links).

## Publicar (cuidado: es producción)
- **Todo push a `main` publica la web** (`deploy.yml`: withastro/action → GitHub Pages). También
  `gh workflow run deploy.yml`. No probado aquí a propósito: no se publica sin OK de Saf.
- Noticias: un `.md` por idioma en `src/content/news/{es,en}/` con el mismo `translationKey`; contrato en
  `docs/CONTENIDO.md` (lo valida `src/lib/news/schema.ts`; si falla, el build falla). Pages CMS (`.pages.yml`,
  guía `docs/COMO-PUBLICAR.md`) escribe directo en el repo. `content-check.yml` valida esos cambios.
- **Norma para publicar noticias: `docs/METODOLOGIA-NOTICIAS.md`** (única; pensada para agentes). Siempre rama → PR →
  CI verde → fusionar. `npm run noticias -- lista | comprobar | foto buscar/guardar` (reglas en `scripts/noticias-lib.mjs`,
  el CI ejecuta `comprobar --sin-red`). Toda noticia nueva lleva foto de Wikimedia Commons, `tema` y `angulo`.
- Línea editorial: sólo avances prometedores contrastados en ≥2 fuentes; nada que deje mal al cannabis. Sin publicidad
  ni enlaces de afiliado (decisión de Saf, 2026-11-28).

## Bot de noticias (`bot/`)
- Paquete aparte (su `package.json`): RSS/PubMed → filtro → LLM → post ES+EN. Doc en `bot/README.md`.
- **No redacta solo**: GitHub Models se retiró (30/07/2026). Cron comentado en `news-bot.yml`; sólo `workflow_dispatch`.
  Cambiar a un LLM de pago (p. ej. Claude) necesita OK de Saf.
- `npm run dry-run` necesita un token de LLM; no probado.
- `bot/state/*.json` lo escriben los workflows (seen, instagram): no editar a mano.

## Instagram (apagado)
- `instagram.yml`: tras cada deploy correcto publica la tarjeta de los posts con `instagram: pending`. Sólo corre si
  la variable de repo `IG_ENABLED` vale `true` (hoy no). A mano: `dry_run` activado por defecto.
- `instagram-token-refresh.yml`: día 1 de cada mes 06:00 UTC (y `workflow_dispatch`). Llama a
  `graph.instagram.com/refresh_access_token` y guarda el token nuevo en el secreto `IG_ACCESS_TOKEN` con
  `gh secret set`, usando el PAT fine-grained `GH_PAT_SECRETS` (Secrets: read & write sólo en este repo).
  Si falla se pone en rojo: hay que generar un token a mano (`docs/INSTAGRAM-SETUP.md`).
- Secretos: `IG_ACCESS_TOKEN`, `IG_USER_ID`, `GH_PAT_SECRETS`. Variables: `IG_ENABLED`, `IG_LANG`, `IG_API_VERSION`,
  `IG_MAX_PER_RUN`. Falta la app de Meta: está bloqueado por Saf.

## Mapa
- `src/pages/` rutas por idioma · `src/components/home/` portada · `src/layouts/` Base, NewsList, NewsPost.
- `src/i18n/*.json` textos (toda clave nueva en los 8 idiomas o el build falla) · `src/content/` noticias y eventos.
- `src/config/site.ts` flags de secciones (equipo, socios, cifras, redes): apagadas hasta tener datos reales de Saf.
- `src/data/` evidencia (notas A–E), legal, créditos, evento · `scripts/` i18n, tarjeta social (satori), capturas.
- `e2e/` Playwright (`*.e2e.ts`) · `tests/crawl-links.mjs` · `legacy/` web antigua (fuera del build, sólo consulta).
- `docs/` plan, contrato de contenido, guías de publicación e Instagram, prompts históricos.

## No tocar sin motivo
- Repo público: nunca secretos en el código ni en logs (`.env*` está ignorado). La clave de Web3Forms es pública.
- IDs del formulario de contacto (Web3Forms), `ClientRouter`, `src/data/evidence.ts`, rutas y `public/CNAME`.
- No inventar datos legales, equipo, cifras ni fechas: las secciones siguen ocultas hasta que Saf los dé.

## Estado del trabajo
`docs/TAREAS.md` (hecho / en curso / pendiente de Saf). Contexto extra: `docs/CONTINUAR.md` y `docs/PLAN.md`.
