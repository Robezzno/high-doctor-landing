# Capturas y medidas — prompt 03 (animaciones)

Todo lo de esta carpeta sale de la web servida en local con `npm run preview`
(estático) y se genera con:

```bash
NODE_PATH=/home/saf/Coding/node_modules node scripts/motion-audit.mjs
```

El script comprueba 26 cosas (motor de animación, SplitText, DrawSVG, hilo de
progreso, checklist, pin, relleno de botones, View Transitions, formulario,
sin JS, `reduced-motion`, CLS y long tasks) y deja aquí los vídeos y las
capturas. Playwright no es dependencia del proyecto: sólo se usa para esto.

## Qué hay en cada archivo

| Archivo | Qué se ve |
|---|---|
| `hero-1440.png` / `hero-390.png` | Hero con el titular partido, el trazo de rotulador dibujado y la molécula completa |
| `mision-protocolo-1440.png` / `-390.png` | Protocolo 01–06 con las marcas manuscritas ya puestas |
| `como-trabajamos-1440.png` / `-390.png` | Sección pinneada a mitad de recorrido (escritorio) y en flujo normal (móvil) |
| `impacto-1440.png` / `-390.png` | Filas de impacto con la primera abierta y su mini ilustración |
| `hilo-progreso-1440.png` | Recorte del margen izquierdo: hilo relleno y número `§` |
| `formulario-enviado-{escritorio,movil}.png` | Envío correcto con el personaje y el sello APPROVED |
| `reduced-motion-1440.png` | La página con `prefers-reduced-motion: reduce` (sin animación) |
| `sin-js-1440.png` / `sin-js-390.png` | La página con JavaScript desactivado: todo el contenido se lee |
| `full-1440.png` / `full-390.png` | Página completa |
| `03-escritorio.webm` | Vídeo: hero, scroll completo y envío del formulario en escritorio |
| `03-movil.webm` | Vídeo: lo mismo a 390 px |

## Medidas (build del 2026-10-20)

- **JS de animación (escritorio): ≈ 59 KB gzip** — GSAP 27,1 + ScrollTrigger
  17,4 + SplitText 3,3 + DrawSVG 1,9 + Lenis 5,4 = 55,1 KB, más ≈ 3,7 KB de los
  módulos propios (`src/scripts/motion/**`). El router de Astro (5,7 KB gzip)
  va aparte. En móvil no se descarga nada de eso: el repertorio se resuelve con
  CSS y un `IntersectionObserver` (≈ 1 KB de código propio).
- **CLS: 0** en todas las pasadas (móvil y escritorio).
- **Long tasks durante el scroll (móvil emulado, CPU 4× más lenta): ninguna por
  encima de 100 ms** (máximo observado 67 ms).
- **Lighthouse** (build servido con gzip, como en producción):
  - Accesibilidad **100** en todas las pasadas.
  - Escritorio: 88 y 98 de rendimiento.
  - Móvil: entre 51 y 94 según la carga de la máquina en ese momento. Las
    pasadas con TBT ≤ 70 ms dieron **81, 91 y 94**; las que bajaron de 80
    coincidieron con picos de carga del equipo (media de carga 9–12 por el IDE y
    otros procesos de prueba ajenos a este repo), no con trabajo de la página:
    el móvil no descarga el motor de animación y su presupuesto de tareas largas
    medido aparte es de 67 ms como máximo.
