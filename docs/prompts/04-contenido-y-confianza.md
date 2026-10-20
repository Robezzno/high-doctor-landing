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
