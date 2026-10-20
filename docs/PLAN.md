# Plan de mejora — highdoctor.foundation

Repo: `Robezzno/high-doctor-landing` · Dominio: `highdoctor.foundation` (GitHub Pages).
Fecha del plan: 2026-10-20.

Objetivos:
1. Que la web deje de parecer hecha por una IA y transmita una fundación real, con animaciones y personalidad.
2. Un blog de noticias con **bot automático** y opción de **publicar a mano**.
3. Cada noticia nueva publica sola un **reclamo en Instagram**.

---

## 1. Diagnóstico de la web actual

Una sola página estática (`index.html` + `style.css` + `script.js` + 3 imágenes), servida por GitHub Pages en modo *legacy* desde `main`.

### Fallos graves
- **El formulario no envía nada.** En `script.js` hay un `submit` que hace `e.preventDefault()`, vacía el formulario y nunca llama a Web3Forms. Además busca `#form-success`, que no existe, así que lanza un error. **Todos los leads que llegan desde la web se pierden.**
- **No cumple el RGPD.** Se piden datos personales (nombre, email, país, LinkedIn) sin política de privacidad, sin aviso legal y sin checkbox de consentimiento. Para una fundación europea hay riesgo de multa y pierde credibilidad.

### Por qué parece "AI slop"
- Usa **emojis como iconos** (🔬📚🩺🛡️🌍🤝) y ✔/✓ en listas.
- Tiene una **red de partículas en canvas** encima de una **imagen de stock generada por IA**, también de partículas: el cliché número uno de las webs hechas por IA.
- **vanilla-tilt con brillo** en todas las tarjetas, glassmorphism y degradados turquesa/dorado.
- Dos **rejillas de 6 tarjetas idénticas** seguidas (Impact y Why Join) con textos intercambiables.
- El texto es genérico ("Advancing Cannabis Knowledge for a Better Future", "Building the future together") y no aporta datos, nombres, fechas ni pruebas.
- **Personalidad de marca desaprovechada.** El logo es un personaje de cartoon (un científico loco con bata y gafas), pero la web parece una plantilla biotech. Hay que elegir una identidad y llevarla hasta el final.

### Problemas de marca y assets
- `logo-character.png` es **una captura de pantalla**: tiene pintado el fondo de cuadros que simula transparencia y un borde negro a la derecha. Ahora mismo se ve así en el footer.
- `logo-text.png` tiene la mitad inferior del lienzo vacía.
- No hay favicon, ni imagen para compartir (og:image), ni enlaces a redes sociales.

### Rendimiento
- Imágenes sin optimizar: 750 KB + 987 KB en PNG/JPEG de 1024 px.
- El canvas compara todas las partículas entre sí 60 veces por segundo en toda la pantalla, aunque no se vea: gasta batería en el móvil.
- El listener de scroll no está limitado, Google Fonts bloquea el renderizado y vanilla-tilt se carga desde un CDN.

### SEO
- Las 8 traducciones (todas completas, 92 claves) se aplican **con JS en el navegador**. Google sólo indexa la versión en inglés y no hay `hreflang`.
- Faltan sitemap, schema.org (Organization/NGO), canonical y Open Graph.

### Contenido
- La sección "Mary Jane Berlin" depende de una fecha que no aparece, así que se queda caducada.
- No hay equipo, socios, eventos pasados ni cifras reales: nada que demuestre que la fundación existe.

---

## 2. Arquitectura objetivo

```
                  ┌───────────────────────────── GitHub repo (main) ─────────────────────────────┐
 Tú (móvil/PC) ──►│ Pages CMS (app.pagescms.org) ──commit──► src/content/news/<lang>/<slug>.md    │
                  │                                                    ▲                          │
 GitHub Actions   │ news-bot.yml (cron) ── RSS → filtro → LLM → .md ───┘                          │
                  │                                                                               │
                  │ deploy.yml (push a main) ── astro build → GitHub Pages (highdoctor.foundation)│
                  │        └─ genera /social/<slug>.jpg (tarjeta 1080×1350) + og:image             │
                  │                                                                               │
                  │ instagram.yml (tras deploy OK) ── posts con instagram: pending                │
                  │        └─ Instagram API (Instagram Login) → publica imagen + caption          │
                  │        └─ marca el post como instagram: published (commit) → idempotente      │
                  └───────────────────────────────────────────────────────────────────────────────┘
```

- **Astro** genera una web estática: HTML real por idioma (SEO), colecciones de contenido para el blog, optimización de imágenes, RSS y sitemap. Se publica con GitHub Actions en el mismo GitHub Pages y con el mismo dominio. Sin servidores y sin coste.
- **Blog:** archivos Markdown en el repo. Escriba quien escriba (tú, el bot o el CMS), es el mismo formato y el mismo flujo.
- **Publicación manual:** [Pages CMS](https://pagescms.org), gratis y de código abierto. Te conectas con GitHub y tienes un editor visual con subida de imágenes que funciona desde el móvil. Cada guardado es un commit que lanza el deploy.
- **Bot automático:** un workflow de GitHub Actions programado. Lee fuentes RSS fiables, descarta duplicados y temas fuera de línea, y redacta una noticia original (resumen + contexto + enlace a la fuente) en ES y EN.
- **Instagram:** API oficial de Meta, *Instagram API with Instagram Login* (gratis, no necesita página de Facebook). La imagen del reclamo se genera sola con la plantilla de marca. **No** se usa `instagrapi` (lo que usan tus bots antiguos de `high-doctor-channel`) porque Instagram detecta los accesos no oficiales y banea la cuenta.

### Decisiones tomadas
| Tema | Decisión | Por qué |
|---|---|---|
| Framework | Astro (estático) | Un HTML por idioma, blog con colecciones, cero JS por defecto y despliegue gratuito en Pages |
| Idioma por defecto | EN en `/`, el resto en `/es/`, `/de/`… | Mantiene el comportamiento actual (público europeo) y añade SEO por idioma |
| Idiomas del blog | ES + EN; los otros 6 idiomas muestran EN | Generar 8 versiones de cada noticia multiplica coste y errores |
| Animaciones | GSAP + ScrollTrigger (ahora gratis, incluidos los plugins) + Lenis + View Transitions de Astro | Calidad profesional y control fino; respeta `prefers-reduced-motion` |
| CMS manual | Pages CMS | Gratis, sin backend que mantener y funciona desde el móvil |
| LLM del bot | GitHub Models (gratis con `GITHUB_TOKEN`) por defecto, con interfaz para cambiar de proveedor | Coste cero. Si la calidad no basta, pasar a Claude Haiku (de pago, **se te consulta antes**) |
| Imagen social | Satori + resvg + sharp → JPEG 1080×1350 | Una sola plantilla sirve de portada del post, og:image e imagen de Instagram, y no usa fotos con copyright |
| Instagram | API oficial con Instagram Login, app de Meta en modo desarrollo | Sin revisión de app (es tu propia cuenta) y sin riesgo de baneo por acceso no oficial |

---

## 3. Fases y prompts

Los prompts están en `docs/prompts/`. Ejecútalos **en orden**: cada uno da por hecho que el anterior ya está terminado.

| # | Prompt | Resultado | Depende de ti |
|---|---|---|---|
| 00 | `00-arreglar-formulario.md` | El formulario envía de verdad (hotfix sobre la web actual) | — |
| 01 | `01-migracion-astro.md` | La misma web en Astro, 8 idiomas como rutas estáticas y deploy con Actions | — |
| 02 | `02-identidad-visual.md` | Sistema de diseño nuevo, logo limpio, sin estética IA | Si tienes el logo original en vector, mejor |
| 03 | `03-animaciones.md` | Animaciones con GSAP/Lenis, microinteracciones y transiciones | — |
| 04 | `04-contenido-y-confianza.md` | Textos reescritos, equipo, eventos, redes y legal (RGPD) | Datos reales: equipo, CIF, dirección, redes |
| 05 | `05-blog.md` | Blog multidioma, RSS, generador de tarjetas sociales | — |
| 06 | `06-publicacion-manual-cms.md` | Pages CMS configurado | Entrar una vez en app.pagescms.org |
| 07 | `07-bot-noticias.md` | Bot automático en Actions | Confirmar el LLM (gratis o de pago) |
| 08 | `08-instagram.md` | Reclamo automático en Instagram | Crear la app de Meta y el token (guía paso a paso) |
| 09 | `09-seo-rendimiento-qa.md` | SEO, Lighthouse ≥ 95 y QA final | — |

## 4. Qué puede costar dinero o necesita una acción tuya
- **LLM del bot:** GitHub Models es gratis con límites diarios, de sobra para 1–3 noticias al día. Si la calidad no convence, la alternativa es Claude Haiku 5.5 (unos céntimos al mes con este volumen). **Pedir aprobación antes.**
- **Instagram:** gratis. La cuenta tiene que ser Profesional (Business o Creator). Tienes que crear la app en developers.facebook.com y generar el token; el prompt 08 lo explica paso a paso.
- **Refrescar el token de Instagram** (caduca a los 60 días): un workflow mensual lo renueva. Para guardar el nuevo token en los Secrets hace falta un PAT de GitHub con permiso sobre secrets (gratis).
- Lo demás (Astro, GitHub Pages, Actions en repo público, Pages CMS, GSAP) es gratis.

## 5. Riesgos y cómo se mitigan
- **Políticas de Meta sobre cannabis:** Instagram limita o elimina contenido que promueve la venta o el consumo. Los reclamos serán educativos o informativos: sin productos, sin precios, sin llamadas al consumo y sin hashtags vetados. La lista de hashtags vive en un fichero configurable.
- **Contenido de salud generado por IA:** el bot no da dosis ni consejos médicos, siempre cita y enlaza la fuente original y añade un aviso. Hay un modo `review` (abre un PR en vez de publicar) para las primeras semanas.
- **Copyright:** sólo resúmenes originales con enlace a la fuente. Nunca se copia el texto ni se reutilizan imágenes de terceros; la portada sale de nuestra plantilla.
- **Cambio de modo de despliegue de Pages** (legacy → Actions): se valida el build antes de cambiarlo y el `CNAME` se conserva en `public/`. Así se evita que el dominio se caiga.
