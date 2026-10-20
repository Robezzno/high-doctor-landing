# TAREAS — highdoctor.foundation

## Hecho
- 2026-10-20: repo localizado (`Robezzno/high-doctor-landing`), acceso de push comprobado, diagnóstico de la web y plan completo en `docs/PLAN.md`.
- 2026-10-20: prompts de ejecución en `docs/prompts/` (00 → 09) y `_config.yml` para que Jekyll no publique `docs/` en la web.

- 2026-10-20: prompt 06 — Pages CMS configurado (.pages.yml con las dos colecciones ES/EN, guía docs/COMO-PUBLICAR.md, workflow content-check.yml que valida el contenido en cada PR). **Pendiente de Saf**: entrar una vez en https://app.pagescms.org con GitHub y hacer la prueba real desde el móvil.

## En curso
- Prompt 03 (animaciones), prompt 08 (Instagram) y prompt 04 (contenido/legal, necesita datos de Saf).

## Hecho (además)
- 2026-10-20: prompt 01 — web migrada a Astro 7 (TS strict): 8 rutas estáticas por idioma con hreflang/canonical, i18n extraído por script (95 claves × 8 idiomas, el build falla si falta una), imágenes optimizadas AVIF/WebP, formulario Web3Forms conservado, workflow deploy.yml con withastro/action. Web antigua en `legacy/`. Pages pasa a modo workflow. Capturas comparativas en `docs/capturas/01-migracion-astro/`.

## Cómo retomarlo
1. Lee `docs/PLAN.md` y `docs/prompts/README.md`.
2. Ejecuta el primer prompt que no esté en "Hecho", en orden.
3. Al terminar cada prompt, muévelo aquí a "Hecho" con fecha y haz commit.

## Pendiente de Saf
- Logo original en vector o PNG con transparencia real (prompt 02).
- Datos legales de la entidad, equipo, socios, eventos y redes (prompt 04).
- OK para el LLM del bot: gratis (GitHub Models) o de pago (Claude Haiku) (prompt 07).
- Crear la app de Meta y el token de Instagram siguiendo `docs/INSTAGRAM-SETUP.md` (prompt 08).

## Ideas pendientes
- **Fase futura — noticias programadas**: como GitHub Models se retiró (30/07/2026), el bot no redacta solo. Cuando esté todo construido, generar en lote las noticias (con el asistente), dejarlas programadas con fecha futura y revisarlas antes. El cron del bot (news-bot.yml) está comentado hasta entonces.
- Fecha real de Mary Jane Berlin y enlace oficial → `src/data/event.ts` (hoy muestra "Por confirmar").
