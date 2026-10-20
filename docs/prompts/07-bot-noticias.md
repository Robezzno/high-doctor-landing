# 07 — Bot de noticias automático (GitHub Actions)

## Objetivo
Un bot que, sin servidor y sin coste, busca noticias relevantes sobre cannabis (ciencia, salud, legislación en Europa y cultura), escribe un post **original** en ES y EN siguiendo el contrato de `docs/CONTENIDO.md` y lo publica (o lo deja para revisión). El post entra en el mismo flujo que los manuales, así que también saldrá en Instagram con el prompt 08.

## Antes de empezar: consulta a Saf (coste)
Pregunta en una línea: "El bot usará GitHub Models (gratis, con límite diario). Si la calidad no te convence, la alternativa es Claude Haiku, de pago (céntimos al mes). ¿Empiezo con el gratis?". Implementa una interfaz `LLMProvider` con dos adaptadores (`github-models` y `anthropic`) y elige el proveedor con la variable `LLM_PROVIDER`. **No** configures la clave de Anthropic sin el OK de Saf.

## Arquitectura
`bot/` en TypeScript (Node 22, ejecutado con `tsx`), con tests en `vitest`.
```
bot/
  sources.yml        # fuentes RSS con peso y categoría por defecto
  config.yml         # frecuencia, máximos, palabras vetadas, modo publish|review
  src/fetch.ts       # lee RSS (rss-parser), normaliza
  src/filter.ts      # relevancia, frescura, vetos, deduplicado
  src/write.ts       # prompt al LLM → JSON validado con Zod
  src/publish.ts     # escribe .md ES+EN, commit o PR
  state/seen.json    # URLs y hashes ya procesados (idempotencia)
```

### 1. Fuentes (`sources.yml`)
Empieza con 8–12 fuentes fiables y con RSS **comprobado** (descárgalas una a una y mira que respondan). Mezcla:
- Ciencia: PubMed (búsqueda RSS de `cannabinoid OR cannabidiol`), *Journal of Cannabis Research*, *Cannabis and Cannabinoid Research*.
- Política y legislación europea: noticias del EUDA/EMCDDA y medios europeos especializados (p. ej. Business of Cannabis, Cannabis Industry Journal o equivalentes en ES y DE).
- Reducción de riesgos y cultura: Energy Control (ES), NORML.
Las fuentes de tus bots antiguos (`hightimes.com`, `leafly.com`, `norml.org` en el repo `high-doctor-channel`) valen como pista, pero prioriza fuentes científicas e institucionales: dan credibilidad a una fundación.

### 2. Filtro
- Sólo noticias de ≤ 72 h. Deduplica por URL canónica y por similitud de título (trigramas, umbral 0,6) contra `state/seen.json` y los posts existentes.
- Puntuación por relevancia (palabras clave + peso de la fuente). Descarta temas vetados (`config.yml`): venta, precios, ofertas, cepas o variedades como producto, recetas de consumo y contenido sensacionalista.
- Elige **1 noticia por ejecución** (la de mayor puntuación). Si ninguna supera el umbral, no publica nada. Es preferible no publicar a publicar relleno.

### 3. Redacción (LLM)
- Entrada: título, resumen, URL y el texto del artículo si es accesible (extracción con `@mozilla/readability`, respetando robots y sin saltarse paywalls).
- Salida JSON validada con Zod: `{ es: {title, summary, body, instagramHook, tags}, en: {...}, category }`. Si no valida, se reintenta 1 vez y, si vuelve a fallar, aborta sin publicar.
- System prompt con estas reglas: voz de la fundación (divulgativa, rigurosa, cercana), **300–500 palabras**, estructura (qué ha pasado → por qué importa → contexto → qué no sabemos todavía), **sin dosis ni consejos médicos**, sin promover el consumo, cita la fuente en el texto, no inventes datos, cifras ni citas, y frases que no se parezcan al original (resumen propio, nunca copia).
- Comprobación anti-copia: si hay más del 15 % de 8-gramas en común con el original, se reescribe o se descarta.

### 4. Publicación
- `author: 'bot'`, `source` relleno, `instagram: 'pending'` y el mismo `translationKey` en ES y EN.
- `BOT_MODE=publish`: commit directo a `main` (autor `Robezzno <robezzno@gmail.com>`, sin atribución a IA) con el mensaje `noticia: <título>`. Eso dispara el deploy.
- `BOT_MODE=review`: abre un PR con la etiqueta `noticia-bot`. Saf la aprueba desde la app de GitHub y, al mergear, se publica. **Empieza en `review`** las 2 primeras semanas y apúntalo en `docs/TAREAS.md` para pasarlo a `publish` después.
- Actualiza `state/seen.json` en el mismo commit. Es lo que hace el proceso idempotente: si se relanza, no duplica.

### 5. Workflow `.github/workflows/news-bot.yml`
- `schedule`: L-X-V a las 08:30 Europe/Madrid (en cron UTC hay que contar el cambio de horario; documenta la hora). También `workflow_dispatch` con inputs `dry_run` y `mode`.
- `permissions: contents: write, pull-requests: write, models: read`.
- `concurrency: news-bot` para que no se solapen ejecuciones.
- `dry_run=true`: imprime el post en el resumen del job (`$GITHUB_STEP_SUMMARY`) sin hacer commit.
- **Ojo:** un push hecho con `GITHUB_TOKEN` **no** dispara otros workflows. Para que el commit del bot lance `deploy.yml`, llama a `gh workflow run deploy.yml` al terminar, o haz el push con un PAT o una GitHub App. Elige lo más simple y documéntalo.

## Verificación
- Tests de `filter.ts` (deduplicado, vetos, frescura) y del validador del JSON del LLM con fixtures.
- `workflow_dispatch` con `dry_run=true`: revisa el post generado en el summary. Tiene que tener sentido, citar la fuente y no copiar.
- Una ejecución real en modo `review`: se abre el PR, el build del PR pasa y el post se ve bien en local.
- Commit `feat: bot de noticias automático con GitHub Actions` y push. Explícale a Saf en 3 líneas cómo aprobar las noticias desde el móvil.
