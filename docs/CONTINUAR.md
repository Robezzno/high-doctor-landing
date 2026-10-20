# CÓMO CONTINUAR — lee esto antes de tocar nada

Última actualización: 2026-10-20. Estado: **prompts 00, 01, 02, 05, 06, 07 y 08 hechos, desplegados y verificados en producción.** Parado por decisión de Saf antes de terminar 03, 04 y 09.

## Regla de oro
Los prompts de `docs/prompts/` se ejecutan **en orden** y cada push a `main` publica en producción. Antes de push: `npm run build` sin errores y `npm test`. El agente debe leer `docs/PLAN.md`, `docs/TAREAS.md`, `docs/prompts/README.md` y este fichero.

## Estado por prompt

| # | Prompt | Estado |
|---|--------|--------|
| 00 | Hotfix formulario | ✅ Hecho y en producción. **Pendiente: Saf prueba el formulario (nombre "TEST HDF") y confirma que llega el email.** |
| 01 | Migración a Astro | ✅ Hecho. 8 rutas por idioma, Pages en modo workflow. |
| 02 | Identidad visual | ✅ Hecho. Lighthouse accesibilidad 100. Assets en `src/assets/brand/`. |
| 03 | Animaciones | 🟡 **INCOMPLETO** — trabajo a medias guardado en la rama `wip/prompt-03-animaciones` (ver abajo). |
| 04 | Contenido y legal | 🟡 **Casi hecho en la rama `feat/contenido` (sin commit)**: textos reescritos en 8 idiomas, páginas legales en 8 rutas y secciones de confianza listas pero **ocultas** por flags. Falta que Saf pase los datos reales (ver «Pendiente de Saf») y la revisión visual en navegador. |
| 05 | Blog + tarjetas | ✅ Hecho y en producción. `/noticias/`, `/en/news/`, RSS, tarjetas 1080×1350. |
| 06 | Pages CMS | ✅ Hecho. **Pendiente: Saf entra en app.pagescms.org y hace la prueba real.** |
| 07 | Bot de noticias | ✅ Infra hecha, **cron desactivado** (ver «Cambio de plan del bot»). |
| 08 | Instagram | ✅ Flujo completo montado y probado (97 tests), **apagado hasta que Saf pase credenciales** (ver `docs/INSTAGRAM-SETUP.md`). |
| 09 | SEO y QA final | ⏳ Pendiente (el último de todos). |

## Cómo retomar el prompt 03 (animaciones)
1. `git checkout wip/prompt-03-animaciones` y revisa qué dejó el agente: `git diff main...wip/prompt-03-animaciones --stat` (~30 ficheros: sistema GSAP en `src/scripts/motion/`, sección nueva `src/components/Process.astro`, cambios en componentes e i18n).
2. Decide si continúas desde ahí o descartas la rama y lo rehaces de cero (`git branch -D wip/prompt-03-animaciones && git push origin --delete wip/prompt-03-animaciones`).
3. Ejecuta el prompt 03 completo (`docs/prompts/03-animaciones.md`) y sus verificaciones (reduced-motion, JS desactivado, peso ≤ 60 KB gzip, Lighthouse ≥ 90).
4. **AVISO**: en la rama wip el build no está verificado. Ejecuta `npm run build` antes de confiar en ella.

## Cambio de plan del bot (importante, decisión de Saf del 2026-10-20)
GitHub **retiró GitHub Models el 30/07/2026** (el endpoint devuelve basura), así que el bot no puede redactar solo. Plan nuevo acordado:
- **No usar LLM externo.** En una fase futura, cuando todo esté construido, el asistente (GLM) **genera las noticias de todo el año en lote**, Saf las revisa y se dejan **programadas** con fecha futura para publicarse solas.
- La infraestructura del bot está lista para esa fase: `bot/` (fuentes RSS verificadas, filtro anti-duplicados, contrato de contenido) y `docs/CONTENIDO.md`.
- El cron está comentado en `.github/workflows/news-bot.yml`. Se reactiva sólo si se elige un proveedor LLM. No tocar hasta entonces.
- Las noticias llegan mientras tanto por el CMS (prompt 06) o por la fase de lote.

## Instagram: qué falta (lo hace Saf, 10-15 min, gratis)
Guía paso a paso en `docs/INSTAGRAM-SETUP.md` (verificada contra la documentación de Meta el 2026-10-20):
1. Cuenta de Instagram a Profesional.
2. Crear app en developers.facebook.com + permisos `instagram_business_basic` y `instagram_business_content_publish`.
3. Generar token + copiar el Instagram User ID.
4. Pasar token e ID al agente **por chat privado** (nunca en un commit).
5. El agente: `gh secret set IG_ACCESS_TOKEN` + `gh secret set IG_USER_ID` + `gh variable set IG_ENABLED --body true`, dry run, y la **primera publicación real sólo con confirmación explícita de Saf**.
Mientras `IG_ENABLED` no sea `true`, el flujo de Instagram sale sin hacer nada (botón del pánico ya operativo).

## Pendiente de Saf (resumen)
- Probar el formulario en producción con "TEST HDF" y confirmar el email.
- Entrar la primera vez en app.pagescms.org y hacer la prueba real desde el móvil.
- Decidir qué hacer con la rama `wip/prompt-03-animaciones`.
- Datos reales para el prompt 04: nombre legal de la entidad, CIF, domicilio, **registro**, email público, equipo (nombre, rol, foto y permiso), socios (logo y permiso), cifras demostrables, evento Mary Jane Berlin (fecha y stand) y redes sociales. Mientras falten, esas secciones quedan ocultas por flags en `src/config/site.ts` — **no inventar nada**.
- Instagram: pasos de arriba.
- Verificar el dominio en Google Search Console (prompt 09, registro DNS TXT; el agente explica cómo).

## Prompt 04: qué queda para publicar (rama `feat/contenido`)

Ya está escrito todo el contenido y el código; **falta rellenar datos y revisar en navegador**. Al llegar cada dato, se rellena `src/config/site.ts` y se pone su flag en `true` (`team`, `partners`, `stats`, `events`, `social`, `entityLegalData`). La fecha de Mary Jane Berlin va en `src/data/event.ts` (`null` = "por confirmar").

- Páginas legales nuevas: `/legal/legal-notice`, `/legal/privacy`, `/legal/cookies` (EN) y sus equivalentes en los otros siete idiomas.
- El texto legal es una **plantilla orientativa**: debe revisarla un abogado o un asesor de protección de datos.
- Mientras `entityLegalData` sea `false`, las páginas legales muestran un aviso de borrador y los datos de la entidad entre corchetes.
- Verificación hecha: `npm run build` y `npm test`. Pendiente: revisión visual de las 8 rutas (textos largos, sobre todo alemán y polaco) y comprobar los enlaces legales en todos los idiomas.

## Orden recomendado al retomar
1. Prompt 03 (desde la rama wip o desde cero) → revisar → publicar.
2. Prompt 04 (con los datos de Saf) → revisar `feat/contenido` en navegador → publicar.
3. Prompt 09 (SEO, rendimiento, QA final, ci.yml) → publicar.
4. Fase futura: noticias en lote generadas por el asistente + programación anual (+ reactivar Instagram en cuanto haya credenciales).

## Trucos de operación
- Los agentes trabajadores **no commitean**: el que orquesta revisa, hace commit con autor `Robezzno <robezzno@gmail.com>` (sin atribución a IA) y push.
- Si dos agentes trabajan a la vez, cada uno en su **worktree/rama**; los merges los hace el orquestador resolviendo a mano `package.json`, i18n y componentes compartidos (ya pasó: ver historial de merges del 2026-10-20).
- La web se comprueba con: `curl -s -o /dev/null -w "%{http_code}" https://highdoctor.foundation/` tras cada deploy (`gh run watch` del workflow `Deploy a GitHub Pages`).
- Docs de apoyo: `docs/CONTENIDO.md` (contrato de noticias), `docs/COMO-PUBLICAR.md` (guía para Saf), `docs/INSTAGRAM-SETUP.md`, `src/assets/brand/PALETA.md` (colores reales: azul #000C3C, verde #00B63F).
