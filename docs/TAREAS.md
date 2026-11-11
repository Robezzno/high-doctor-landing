# TAREAS — highdoctor.foundation

## Rediseño 2026-11 (rama `rediseno`, pendiente de OK de Saf para publicar)
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
