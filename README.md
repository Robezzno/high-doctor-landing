# High Doctor Foundation

Web de **High Doctor Foundation** (highdoctor.foundation): Astro 7, 8 idiomas
(en, es, de, fr, it, pt, nl, pl), blog en ES/EN, bot de noticias, publicación
en Instagram y CMS para publicar desde el móvil. Hosting: **GitHub Pages**
(cada push a `main` publica en producción).

## Publicar contenido

- **Blog**: ficheros Markdown en `src/content/news/` — o desde el móvil con
  **Pages CMS** (guía paso a paso en [`docs/COMO-PUBLICAR.md`](docs/COMO-PUBLICAR.md)).
- **Eventos**: Markdown en `src/content/events/`. Las secciones con datos sin
  confirmar permanecen ocultas por flags en `src/config/site.ts`.

## Bot de noticias

`bot/` recoge titulares de 11 fuentes RSS verificadas, filtra duplicados y
valida cada noticia contra el contrato de `docs/CONTENIDO.md`. **No redacta
solo** (GitHub Models fue retirado): la fase prevista es generar las noticias
en lote y dejarlas programadas con fecha futura. El cron está desactivado en
`.github/workflows/news-bot.yml`; se puede lanzar a mano con `workflow_dispatch`.

## Instagram

Flujo completo de publicación automática tras cada deploy (`.github/workflows/instagram.yml`)
y refresco mensual de token (`instagram-token-refresh.yml`). Está **apagado**
hasta crear la app de Meta: guía en [`docs/INSTAGRAM-SETUP.md`](docs/INSTAGRAM-SETUP.md).

## Cómo pausar cada cosa

| Qué | Interruptor |
|-----|-------------|
| Publicación en Instagram | Variable de repo `IG_ENABLED` ≠ `true` (o `false`) |
| Bot de noticias | Cron comentado en `news-bot.yml` |
| Redes / equipo / cifras | Flags en `src/config/site.ts` (falsos por defecto) |
| Web entera | No hay: es estática en GitHub Pages |

## Secrets y variables (sólo nombres, nunca valores)

- `IG_ACCESS_TOKEN` (secret) — token de la Instagram Graph API.
- `IG_USER_ID` (secret) — Instagram User ID.
- `IG_ENABLED` (variable) — interruptor del flujo de Instagram.
- Las claves del formulario de contacto viven en `src/` (Web3Forms, clave pública).

## Desarrollo

```bash
npm install
npm run dev        # servidor local
npm run build      # build + i18n:check
npm test           # vitest (unitarios)
npm run qa         # build + e2e Playwright + crawler de enlaces
npm run qa:links   # sólo crawler sobre dist/
```

- QA y detalles de operación: [`docs/CONTINUAR.md`](docs/CONTINUAR.md).
- Plan e histórico de prompts: [`docs/PLAN.md`](docs/PLAN.md) y [`docs/prompts/`](docs/prompts/).
