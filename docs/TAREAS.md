# TAREAS — highdoctor.foundation

> **Proyecto en pausa (2026-11-12).** El publicador automático y la documentación interna viven en el repo **privado** `Robezzno/high-doctor-publicador` (ver su `COMO-SEGUIR.md`). Este repo es público y sólo contiene la web.

## Noticias de la web (manuales mientras no hay publicador)
- 2026-11-14: dos noticias nuevas en ES y EN (rama `rediseno`, salen al publicar el rediseño), contrastadas en ≥2 fuentes cada una:
  - `hombres-mujeres-efectos-cannabis-ucla` (investigación): estudio de UCLA en *Neuropsychopharmacology* (nota oficial de UCLA + News-Medical; DOI en el texto).
  - `anmat-prohibe-aceite-cannabis-sin-registro` (salud): Disposición ANMAT 7206/2026 (Boletín Oficial + Infobae + La Nación). Enlaza con el mito «cualquier aceite de CBD sirve».
- 2026-11-16: dos más en ES y EN, publicadas también en `main` (producción) junto a las del 14:
  - `cbd-memoria-miedo-estres-postraumatico` (investigación): CBD y extinción del miedo en ratas, USP Ribeirão Preto (*Neuropharmacology*, doi:10.1016/j.neuropharm.2026.111256, resumen en Europe PMC + Marijuana Herald). Sustituye a la del cáncer oral, retirada por Saf.
  - `cannabis-dolor-cronico-registro-britanico` (investigación): registro británico, 3.744 pacientes con dolor crónico a 24 meses (*J Clin Pharmacol*, doi:10.1002/jcph.70313, resumen en Europe PMC + NORML). Sustituye a la del ictus (AHA), retirada por petición de Saf: línea editorial en `docs/CONTENIDO.md`.
- 2026-11-17: **gráfico propio en cada noticia** (campo `grafico` del contrato): cifra clave, etiqueta y hasta 3 datos con barra. Sale en la tarjeta social, la imagen OG, la portada del post y como miniatura en el listado. Publicado en `main`.
- Cómo añadir más a mano: contrato en `docs/CONTENIDO.md`; un `.md` por idioma en `src/content/news/{es,en}/` con el mismo `translationKey`, `author: equipo`, `source` con la fuente original e `instagram: 'off'`. `npm run build` valida el esquema.

## Rediseño v3 «más elegante» — PUBLICADO en producción el 2026-11-17 (incluye v2)
- 2026-11-17: encargo de Saf: rediseñar con la skill **Modern Web Guidance** de Google Chrome (instalada en `~/.claude/skills/modern-web-guidance`, CLI `npx -y modern-web-guidance@latest search|retrieve`) para que quede más elegante. Sin publicar; solo se publicaron los gráficos de noticias.
  - `legacy-scan src` → 0 hallazgos (el código ya es moderno; el salto es de diseño).
  - Dirección «la etiqueta, bien impresa»: solo Rubik con jerarquía por peso (titulares 500, 800 sólo para letras A–E), escala con menos tamaños, suelo blanco sin bandas, verde sólo en acción/foco, mascota en busto sin rótulo, notas en filas de tabla.
  - Pasos (marcar al terminar):
    - [x] 1 Base: tokens.css, global.css, Base.astro (pesos, escala, sin `.section--tint`).
    - [x] 2 Hero: letra activa gigante, una línea de veredicto, select `base-select` con @supports, busto. Conservar ids/data-*.
    - [x] 3 Notas (Grades): filas A→E, sin pastillas de color, `::details-content` + `interpolate-size`. Conservar `evd-*`.
    - [x] 4 Método, Quiénes somos, Únete: más compactos.
    - [x] 5 `NewsFigure.astro`: gráfico en HTML en portada, destacado, listado y post.
    - [x] 6 Tarjeta social con tokens y Rubik.
    - [x] 7 Blog: titulares 500, chips píldora, portada del post baja, progreso de lectura.
    - [x] 8 Movimiento más corto (opcional).
    - [x] 9 Cierre: build, vitest, e2e+axe, qa:links, capturas ES/DE/PL a 1440 y 390.
  - 2026-11-17: **v3 completa en la rama, sin publicar.** vitest 139/139, e2e+axe 41/41, qa:links OK (61 páginas), capturas ES/DE/PL a 1440 y 390. Copia para el móvil en churflix: `/srv/media/sync/High Doctor Foundation - web v3.html`.
  - 2026-11-17: **publicada**: merge de `rediseno-v3` en `main` (7a5279f), deploy de Pages OK, los 8 idiomas responden 200 y sirven el diseño nuevo. Tarjetas sociales nuevas (Rubik) también en producción.
    - Guías de modern-web-guidance aplicadas: typography, visually-stable-font-fallbacks, branded-select-styling, accordion, animate-to-intrinsic-sizes, card, scroll-progress-indicator.
    - Ojo e2e: `astro preview` ahora se queda en segundo plano y Playwright cree que «sale antes de tiempo»; arrancar antes `npm run preview -- --port 4321 --host 127.0.0.1` (lo reutiliza) y pararlo con `npx astro preview stop`.
    - Hecho (2026-11-17): fuera el Title Case en los 8 idiomas (el alemán conserva sus sustantivos en mayúscula) y placeholders del formulario traducidos (`form_ph_*`). Lo hizo `despacho-ia trabajar`, lo verificó `verificar` (i18n, 139 tests, build, dist sin «Dr. Jane Doe», 276 claves iguales en los 8 JSON).
    - Para publicar: OK de Saf → merge de `rediseno-v3` (incluye v2) a `main`.
  - No tocar: ClientRouter, IDs del formulario, evidence.ts, rutas. Claves i18n nuevas en los 8 idiomas.

## Rediseño v2 «etiqueta de evidencia» (rama `rediseno`, pendiente de OK de Saf para publicar)
- 2026-11-11: Saf rechazó la v1 («no hay coherencia entre el tamaño de las cosas y la misión»). Investigados referentes (Drug Science, MAPS, Cochrane, OWID, Project CBD, Wellcome) y entrevista: público general y pacientes, acción principal leer/consultar, mascota protagonista. Dirección elegida por Saf: notas A–E tipo etiqueta.
  - Portada: hero con el explorador funcionando (selector → nota A–E + fuente + frase del doctor), todas las notas en fichas desplegables, cómo ponemos la nota, noticias, quiénes somos, Mary Jane Berlín y únete + formulario. Rubik estática (no variable). Contrato en `.impeccable/surfaces/home.md`, producto en `PRODUCT.md`.
  - Copia autocontenida en churflix `/srv/media/sync/High Doctor Foundation - web.html` (se regenera con `node scripts/single-file.mjs es/index.html <salida>` tras `npm run build`).
  - Verificado: vitest 137/137, e2e+axe 41/41, enlaces OK, detector impeccable limpio.

## Rediseño v1 (descartado, historial)
- 2026-11-11: portada rehecha con dirección «informe impreso» (skill design-taste-frontend, seed 25026389):
  - Una sola familia (Bricolage Grotesque), paleta de marca (azul marino, verde estrella), piedra clara en vez de crema, sin monoespaciada, sin sombras ni líneas finas.
  - Secciones nuevas en `src/components/home/`: hero en tablero 2×2, misión, «Cómo trabajamos» (diagrama de 144 cuadrados que se ordenan al entrar), **«Qué dice la evidencia»** (pieza interactiva: 10 temas con nivel NASEM 2017 / EMA y fuente; datos en `src/data/evidence.ts`), capítulos a pantalla completa, unirse, noticias, Mary Jane Berlín y contacto + formulario (mismos IDs y Web3Forms).
  - 9 fotos de archivo de Wikimedia Commons (dominio público / CC), créditos en el footer (`src/data/credits.ts`).
  - Animaciones sin GSAP (IntersectionObserver + CSS, `src/scripts/motion/reveal.ts`), respetan reduced-motion y se leen sin JS. Lenis sólo con ratón.
  - Textos nuevos en los 8 idiomas. Blog y legales heredan colores y tipografía.
  - Verificado: inspector de diseño 0 FAIL en los 8 idiomas a 1440/768/390, `vitest` 137/137, e2e + axe 41/41, crawler sin enlaces rotos.
- 2026-11-11: módulo `publicador/` (rama `feat/publicador`): servicio para VPS que genera con IA y publica en blog + redes. 109 tests, demo en dry-run, Docker. **Nada contratado** (VPS y API de IA de pago necesitan OK de Saf).

### Pendiente del rediseño
- OK de Saf para mergear `rediseno` a `main` (publica en producción).
- Revisar los textos médicos de «Qué dice la evidencia» (ES/EN redactados contra NASEM 2017 y EMA; los otros 6 idiomas traducidos).
- Rediseño a fondo del blog y de las tarjetas sociales (todavía usan Fraunces en la imagen generada).

## Hecho
- 2026-10-20: repo localizado (`Robezzno/high-doctor-landing`), acceso de push comprobado, diagnóstico de la web y plan completo en `docs/PLAN.md`.
- 2026-10-20: prompts de ejecución en `docs/prompts/` (00 → 09) y `_config.yml` para que Jekyll no publique `docs/` en la web.

- 2026-10-20: prompt 06 — Pages CMS configurado (.pages.yml con las dos colecciones ES/EN, guía docs/COMO-PUBLICAR.md, workflow content-check.yml que valida el contenido en cada PR). **Pendiente de Saf**: entrar una vez en https://app.pagescms.org con GitHub y hacer la prueba real desde el móvil.

- 2026-10-20: prompt 08 — flujo de Instagram completo montado y probado con fixtures (97 tests del bot en verde): publicación automática tras cada deploy con la tarjeta generada, caption con hashtags de lista blanca, refresco mensual del token y botón de pausa (IG_ENABLED). **Bloqueado por Saf**: falta la cuenta Profesional, la app de Meta y el token (guía en docs/INSTAGRAM-SETUP.md). No se activa hasta pasar credenciales.

- 2026-10-20: prompt 03 — animaciones con GSAP/ScrollTrigger/SplitText/DrawSVG + Lenis y View Transitions (rama `wip/prompt-03-animaciones`, pendiente de merge y publicación). Hero por líneas con subrayado a rotulador, molécula que se dibuja y respira, hilo de progreso `§`, checklist del protocolo, sección pinneada «Cómo trabajamos», microinteracciones y sello APPROVED. Verificado en local: build sin errores, 111 tests en verde, 59,6 KB gzip de JS de animación, reduced-motion y sin JS legibles, CLS 0 y sin long tasks > 100 ms. Capturas en `docs/capturas/03/`.

## En curso
- Prompt 04 (contenido/legal) — trabajo completo en la rama `feat/contenido` (137 tests), pendiente de merge y de los datos reales de Saf. Detalle en `docs/CONTINUAR.md`.
- Prompt 09 (SEO/QA) — pre-trabajo completo en la rama `feat/seo-qa` (sitemap i18n + robots, JSON-LD NGO, 404 en 8 idiomas, e2e Playwright 41/41, crawler de enlaces, ci.yml, README). Pendiente: Lighthouse final en producción y envío del sitemap a Search Console.

- 2026-10-20: prompt 04 (rama `feat/contenido`, **sin commit**) — contenido y confianza a falta de los datos de Saf:
  - Textos reescritos en los 8 idiomas: hero con titular < 10 palabras ("Cannabis explicado con ciencia, para quien quiere datos") y fuera las frases vacías ("for a better future", "let's build the future together").
  - Páginas legales `/legal/*` en los 8 idiomas (texto ES y EN), con Web3Forms y GitHub como encargados, base legal, conservación y derechos ARCO-POL. Aviso de borrador mientras falten los datos de la entidad y aviso de plantilla revisable por un profesional.
  - Secciones de confianza montadas y **ocultas por flags** en `src/config/site.ts`: equipo (duotono), socios (monocromo), cifras (contador sin GSAP, con `prefers-reduced-motion`) y eventos (colección `events` con archivado automático). Redes sociales en cabecera móvil y footer, también tras flag.
  - Casilla de consentimiento del formulario enlazando a la política de privacidad real de cada idioma. Comprobado que la web no usa cookies ni analítica.
  - **Pendiente de Saf**: nombre legal, CIF, domicilio, registro, email público, equipo, socios, cifras, fecha y stand de Mary Jane Berlin y URLs de las redes. Y revisión del texto legal por un profesional.

## Hecho (además)
- 2026-10-20: prompt 01 — web migrada a Astro 7 (TS strict): 8 rutas estáticas por idioma con hreflang/canonical, i18n extraído por script (95 claves × 8 idiomas, el build falla si falta una), imágenes optimizadas AVIF/WebP, formulario Web3Forms conservado, workflow deploy.yml con withastro/action. Web antigua en `legacy/`. Pages pasa a modo workflow. Capturas comparativas en `docs/capturas/01-migracion-astro/`.

## Cómo retomarlo
1. Lee `docs/CONTINUAR.md` (estado exacto, rama wip de animaciones y pendientes de Saf).
2. Lee `docs/PLAN.md`, `docs/prompts/README.md` y `docs/TAREAS.md`.
3. Ejecuta el primer prompt pendiente en orden (03 → 04 → 09), con los avisos de CONTINUAR.md.
4. Al terminar cada prompt, actualiza este fichero, haz commit y push.

## Pendiente de Saf
- Logo original en vector o PNG con transparencia real (prompt 02).
- **Prompt 04** (rama `feat/contenido`): datos legales de la entidad (nombre, CIF, domicilio, registro), email público, equipo, socios, cifras reales, fecha y stand de Mary Jane Berlin y redes sociales. Sin esos datos las secciones siguen ocultas — no se inventa nada.
- **Prompt 04**: que un abogado o asesor de protección de datos revise la plantilla legal antes de publicarla.
- OK para el LLM del bot: gratis (GitHub Models) o de pago (Claude Haiku) (prompt 07).
- Crear la app de Meta y el token de Instagram siguiendo `docs/INSTAGRAM-SETUP.md` (prompt 08).

## Ideas pendientes
- **Fase futura — noticias programadas**: como GitHub Models se retiró (30/07/2026), el bot no redacta solo. Cuando esté todo construido, generar en lote las noticias (con el asistente), dejarlas programadas con fecha futura y revisarlas antes. El cron del bot (news-bot.yml) está comentado hasta entonces.
- Fecha real de Mary Jane Berlin y enlace oficial → `src/data/event.ts` (hoy muestra "Por confirmar").
- Revisión visual en navegador de las páginas legales y textos reescritos (sobre todo alemán y polaco) antes de publicar el prompt 04.
