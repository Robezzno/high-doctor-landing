# 04 — Contenido creíble, confianza y páginas legales (RGPD)

## Contexto
Los textos actuales son genéricos y no hay nada que demuestre que la fundación es real. Además se recogen datos personales sin política de privacidad. Este prompt es de **contenido**: necesita datos reales de Saf.

## Paso 1 — Pedir datos a Saf (una sola pregunta agrupada)
Pide todo de una vez y en una lista corta:
- Nombre legal de la entidad, CIF/NIF, domicilio y registro (asociación o fundación).
- Email de contacto público.
- Personas del equipo que quieran salir (nombre, rol, foto si la hay).
- Socios o colaboradores reales con logo y permiso.
- Eventos pasados y futuros (Mary Jane Berlin: fechas y stand), cifras reales (miembros, eventos, países).
- URLs de las redes (Instagram, Telegram, X, LinkedIn).

Si algo no llega, **no inventes nada**: deja la sección oculta con un flag en `src/config/site.ts` y apúntalo en `docs/TAREAS.md`. Nunca publiques cifras, socios ni testimonios falsos.

## Paso 2 — Reescritura de textos (8 idiomas)
- Escribe primero ES y EN con tono cercano, concreto y con sentido del humor, coherente con el personaje. Elimina las frases vacías ("Building the future together", "Advancing… for a better future").
- Un titular de hero que diga **qué es y para quién** en menos de 10 palabras, y un subtítulo con el beneficio concreto.
- Traduce a de, fr, it, pt, nl y pl manteniendo el tono, sin traducir literalmente. Revisa que no se rompa la maquetación con textos largos (el alemán suele ser el más largo).
- Mantén el enfoque educativo, científico y de reducción de riesgos. No hagas afirmaciones médicas sin fuente ni promociones de consumo.

## Paso 3 — Secciones de confianza (sólo con datos reales)
- **Equipo**: retratos tratados con un duotono verde/crema coherente con el diseño.
- **Socios / "Han confiado en nosotros"**: logos en monocromo.
- **Cifras**: contador animado (GSAP) sólo si son cifras reales.
- **Eventos**: colección de contenido `events` (Astro content collection) con fecha, ciudad y enlace. Los eventos pasados se archivan solos según la fecha del build.
- **Redes sociales** en la cabecera móvil y en el footer.

## Paso 4 — Legal (RGPD / LSSI-CE, la entidad es española)
- Páginas `/legal/aviso-legal`, `/legal/privacidad` y `/legal/cookies` en ES y EN (el resto de idiomas muestra EN con un aviso), con los datos de la entidad del paso 1.
- La política de privacidad tiene que nombrar a Web3Forms como encargado del tratamiento (y a Pages CMS/GitHub si procede), la finalidad, la base legal (consentimiento), la conservación y los derechos ARCO-POL con su email.
- Comprueba que la web **no usa cookies ni analítica**. Si es así, no hace falta banner, sólo la política de cookies explicándolo. Si en el futuro se añade analítica, que sea sin cookies (p. ej. Cloudflare Web Analytics o Plausible). Lo de pago se consulta.
- El checkbox de consentimiento del formulario enlaza a la política de privacidad real del idioma correspondiente.
- Añade una plantilla de texto con un aviso visible de que es orientativa y debe revisarla un profesional, y menciónaselo a Saf en una línea.

## Verificación
- Revisa con el navegador las 8 rutas sin textos desbordados y enlaces legales funcionando en todos los idiomas.
- Script que comprueba que ningún JSON de i18n tiene claves vacías o en otro idioma (heurística: igual que EN y más de 3 palabras → aviso).
- Commit `feat: contenido real, secciones de confianza y páginas legales` y push.

---

## Estado de ejecución (2026-10-20, rama `feat/contenido`, sin commit)

Hecho **sin inventar ningún dato**:

- **Paso 1 (datos de Saf)**: sigue pendiente. Todo lo que necesita datos reales está detrás de un flag en `src/config/site.ts` y hoy sale oculto.
- **Paso 2 (textos, 8 idiomas)**: hero reescrito con titular < 10 palabras que dice qué es y para quién ("Cannabis explicado con ciencia, para quien quiere datos"), subtítulo con el beneficio concreto, y fuera las frases vacías ("Advancing… for a better future", "Let's build the future together"). También `mission_lead`, `mission_desc`, `impact_subtitle`, `join_subtitle`, `mj_desc`, `form_subtitle` y `ft_tagline`. Tono cercano y sin promesas médicas.
- **Paso 3 (confianza)**: componentes nuevos `Team`, `Partners`, `Stats` y `Events`, más redes en la cabecera móvil y en el footer. Todos se auto-ocultan: `showSection()` exige flag encendido **y** datos reales. `Stats` no usa GSAP (no es dependencia del proyecto; el prompt 03 sigue en su rama wip): contador con `IntersectionObserver` + `requestAnimationFrame`, respeta `prefers-reduced-motion` y el número real va en el HTML.
- **Eventos**: colección `events` en `src/content.config.ts` (fecha ISO o `null` = por confirmar, `draft`), archivado automático pasado/futuro en cada build (`src/lib/events/archive.ts`, con tests). Sólo queda el fichero de ejemplo en `draft: true`. Mary Jane Berlin sigue en `src/data/event.ts` con fecha pendiente ("por confirmar").
- **Paso 4 (legal)**: `/legal/legal-notice`, `/legal/privacy`, `/legal/cookies` en la raíz (EN) y en los otros siete idiomas (`/es/legal/aviso-legal`, `/de/legal/privacy`…). Texto ES y EN completo en `src/data/legal.ts`: Web3Forms y GitHub como encargados, finalidad, base legal (consentimiento), conservación, derechos ARCO-POL con email y AEPD. Los idiomas sin texto propio ven el aviso de que la versión aplicable es la EN. Aviso de borrador visible mientras `sections.entityLegalData` sea `false` y aviso de "plantilla orientativa, que la revise un profesional".
- **Cookies**: comprobado que la web no usa cookies ni analítica (sólo `localStorage.preferredLang`), así que no hay banner y la política de cookies lo explica.
- **Formulario**: la casilla de consentimiento enlaza a la política de privacidad real del idioma (`form_consent_pre` + `form_consent_link` + `form_consent_post`).
- **Verificación i18n**: `src/i18n/translations.test.ts` comprueba claves, valores vacíos, textos copiados del inglés (> 3 palabras) y el límite de palabras del titular del hero. `src/config/site.test.ts` impide activar una sección sin datos o rellenar los datos legales sin confirmar.
- **Logo**: sin cambios (se mantienen `assets/logo-text.png` sin "CSC" y `assets/logo-character.png` con fondo limpio).

Pendiente de Saf (una sola lista): nombre legal, CIF, domicilio, registro, email público, equipo (nombre, rol, foto y permiso), socios con logo y permiso, cifras demostrables, fecha y stand de Mary Jane Berlin y URLs de las redes. Al llegar cada dato: rellenar `src/config/site.ts` y poner su flag en `true`. La fecha del evento va en `src/data/event.ts`.

Recordatorio para Saf: **el texto legal es una plantilla orientativa y debe revisarla un abogado o un asesor de protección de datos** antes de darlo por definitivo.

Verificación ejecutada: `npm run build` (53 páginas) y `npm test` en verde. Queda pendiente la revisión visual en navegador de las 8 rutas.
