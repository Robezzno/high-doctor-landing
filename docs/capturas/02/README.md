# Capturas — prompt 02 (identidad visual "cuaderno de laboratorio")

Dos bloques en esta carpeta:

1. `01`–`05`: verificación de los **assets de marca** (logo limpio, personaje,
   favicon, paleta). Se generaron antes del rediseño.
2. `antes-*` / `despues-*`: capturas de la web **antes y después** del rediseño,
   una por sección, a 390 px y 1440 px. `*-full-*` es la página completa.

Se regeneran con (con `npm run preview` sirviendo en el 4321):

```bash
NODE_PATH=/home/saf/Coding/node_modules node scripts/screenshots.mjs \
  --url http://localhost:4321/ --prefix despues
```

## Pares antes / después

| Sección | Ficheros | Qué cambia |
|---|---|---|
| Barra | `*-nav-390/1440.png` | Logotipo limpio (`logo-text.svg`) sobre papel, enlaces con numeración `01–04` en mono, CTA con sombra dura y selector de idioma desplegable (nombres en su propia lengua). |
| Hero | `*-top-390/1440.png` | Titular serif con la palabra subrayada a rotulador, etiqueta `SPEC-01`, personaje + molécula de Δ⁹-THC dibujada a línea. Fuera `hero-bg.png`, el canvas de partículas y vanilla-tilt. |
| Misión | `*-mission-*.png` | Dos columnas editoriales, capitular, visión como nota al margen con cinta adhesiva, valores como glosario y el listado convertido en **protocolo 01–06** en mono. |
| Impacto | `*-impact-*.png` | Sección verde laboratorio. Fuera la rejilla 3×2: seis **filas desplegables** a todo el ancho (números, iconos lineales propios) y una lámina de especímenes `FIG. 01–04` con THC, CBD, CBG y el receptor CB1. |
| Unirse + formulario | `*-join-*.png` | Una sola sección: "qué obtienes" como columna lateral numerada y el formulario como ficha impresa (etiquetas mono `01…08`, sombra dura). |
| Evento | `*-mary-jane-*.png` | Sección azul marino con ficha troquelada: fecha / ciudad / estado. Sin fecha real todavía (ver más abajo). |
| Pie | `*-footer-*.png` | Grande, con lema, logotipo sobre etiqueta de papel, personaje y cuatro columnas (navegación, contacto, idiomas, legal). |

Nota sobre el idioma: la portada `/` redirige una vez al idioma del navegador
(prompt 01). Las capturas `despues-*` están tomadas en **inglés** de forma
determinista (`localStorage.preferredLang = 'en'` en el script). Las `antes-*`
se tomaron con el build anterior: las de 390 px pueden estar en español y las de
1440 px en inglés, según cómo actuó esa redirección en cada pasada.

## Dirección de arte aplicada

- **Superficies**: papel crema `#F4EFE4` con grano SVG inline al 5 % (cero
  peticiones), secciones alternas en verde laboratorio `#0E2A1F` (impacto y pie)
  y azul marino del logo `#000C3C` (evento). Todo el color sale de
  `src/assets/brand/PALETA.md`.
- **Acentos**: verde estrella `#00B63F` sólo en fondos, bordes y gráficos; para
  texto sobre papel se usa `#0B6B30` (5,8:1). Un único rotulador fluorescente,
  `#DFF25B`, para subrayados, estados y resaltes (tinta encima: 15,2:1).
- **Tipografía** autoalojada con `@fontsource` (eje `wght`, subsets latin y
  latin-ext): Fraunces para titulares, Inter Tight para texto, JetBrains Mono
  para etiquetas y numeración. Los dos ficheros críticos se precargan.
- **Recursos propios**: iconos lineales dibujados a mano (24 px, trazo 1,4),
  moléculas en fórmula esqueletal (THC, CBD, CBG y topología 7TM del CB1),
  etiquetas de espécimen `SPEC-0x`, numeración `§ 0x`, notas al margen, cinta
  adhesiva y ficha troquelada. Cero emojis.
- **Composición**: rejilla de 12 columnas asimétrica, titulares con `clamp`
  hasta 6,75 rem, sombras duras desplazadas (nunca difusas) y radios de 2–4 px.

## Verificación de esta pasada

- `npm run build` (incluye `i18n:check`): 9 páginas, 8 idiomas × 117 claves.
- `npm run check`: 0 errores, 0 avisos.
- Lighthouse (móvil, `/es/`): accesibilidad **100**, rendimiento 95–97 (varía
  entre pasadas), best-practices 100, SEO 100 · FCP ~1,9 s · LCP ~2,2 s · CLS 0
  · TBT 0–44 ms.
- Lighthouse (escritorio, `/es/`): **100 / 100 / 100 / 100** · CLS 0 · TBT 0.
- Lighthouse (móvil, `/`, que redirige a `/es/`): accesibilidad **100**,
  rendimiento 95 (el redirect del prompt 01 cuesta ~0,6 s).
- Peticiones externas (Google Fonts, CDNs): **0** en `/`, `/es/`, `/de/`, `/pl/`,
  `/404`.
- Contraste medido en el navegador sobre todos los nodos de texto (390, 768,
  1024 y 1440 px): **0 fallos AA**.
- Desbordamiento horizontal y textos recortados: **0** en los 8 idiomas a 390 y
  1440 px.
- Objetivos táctiles: enlaces, botones, `summary` y campos ≥ 44 px. Sólo quedan
  por debajo los enlaces dentro de un párrafo (exentos por WCAG 2.5.8) y las
  casillas nativas de 18 px, cuya etiqueta completa es el área pulsable.
- Navegación por teclado probada: salto al contenido, menú móvil con
  `aria-expanded` y cierre con Escape, desplegable de idioma, filas de impacto.

## Pendiente de datos de Saf (placeholders marcados)

| Dónde | Qué falta | Fichero a tocar |
|---|---|---|
| Evento | Fecha real de Mary Jane Berlin y enlace oficial. Ahora la ficha muestra "por confirmar" en los 8 idiomas. | `src/data/event.ts` (`date`, `url`) |
| Pie | Enlaces legales: apuntan a `#privacy` / `#legal` hasta que el prompt 04 cree las páginas. | `src/components/Footer.astro`, `src/components/ContactForm.astro` |
| Redes | El pie no lista redes sociales porque todavía no hay URLs confirmadas (prompt 04). | `src/components/Footer.astro` |
| Titular del hero | Sigue siendo el texto original ("Advancing Cannabis Knowledge…"); el prompt 04 reescribe los textos. | `src/i18n/*.json` |
