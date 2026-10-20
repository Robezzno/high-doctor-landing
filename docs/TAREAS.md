# TAREAS — highdoctor.foundation

## Hecho
- 2026-10-20: repo localizado (`Robezzno/high-doctor-landing`), acceso de push comprobado, diagnóstico de la web y plan completo en `docs/PLAN.md`.
- 2026-10-20: prompts de ejecución en `docs/prompts/` (00 → 09) y `_config.yml` para que Jekyll no publique `docs/` en la web.

- 2026-10-20: prompt 06 — Pages CMS configurado (.pages.yml con las dos colecciones ES/EN, guía docs/COMO-PUBLICAR.md, workflow content-check.yml que valida el contenido en cada PR). **Pendiente de Saf**: entrar una vez en https://app.pagescms.org con GitHub y hacer la prueba real desde el móvil.

- 2026-10-20: prompt 08 — flujo de Instagram completo montado y probado con fixtures (97 tests del bot en verde): publicación automática tras cada deploy con la tarjeta generada, caption con hashtags de lista blanca, refresco mensual del token y botón de pausa (IG_ENABLED). **Bloqueado por Saf**: falta la cuenta Profesional, la app de Meta y el token (guía en docs/INSTAGRAM-SETUP.md). No se activa hasta pasar credenciales.

## En curso
- **PARADO por Saf (2026-10-20)** con los prompts 00/01/02/05/06/07/08 hechos y desplegados. Quedan 03 (wip), 04 y 09. Todo el detalle en `docs/CONTINUAR.md`.

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
