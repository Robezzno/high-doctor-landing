# 02 — Identidad visual nueva: que no parezca hecha por una IA

## Contexto
Lee la sección "Por qué parece AI slop" de `docs/PLAN.md`. La marca tiene un activo muy potente que la web actual ignora: el **personaje**, un científico loco con bata, espejo frontal y gafas redondas, con el logotipo "HIGH★DOCTOR" en letras de cómic con contorno azul marino y estrella verde. La web actual es una plantilla biotech genérica que no tiene nada que ver con eso.

## Dirección de arte: "cuaderno de laboratorio"
Una fundación seria con sentido del humor. La referencia es una **revista científica o cuaderno de laboratorio impreso**, no una startup SaaS.
- **Fondo**: papel crema cálido (`#F4EFE4` aprox.) con un grano sutil (SVG noise al 3–4 %). Secciones alternas en verde laboratorio muy oscuro (`#0E2A1F`) y tinta azul marino del logo (`#0B1640`).
- **Acentos**: el verde de la estrella del logo (`#1DB954` aprox., sácalo del PNG con un cuentagotas) y un único color de "marcador fluorescente" para subrayados y énfasis. Nada de degradados turquesa/dorado.
- **Tipografía**: una serif editorial con carácter para los titulares (p. ej. *Fraunces* o *Instrument Serif*), una grotesca sobria para el texto (p. ej. *Inter Tight* o *Geist*) y una **mono** para etiquetas, numeraciones y "anotaciones de laboratorio" (p. ej. *JetBrains Mono*). Autoalojadas con `@fontsource` y subset latino + latino extendido (por el polaco).
- **Recursos gráficos propios** en vez de emojis:
  - Iconos lineales dibujados a mano o del set *Phosphor* (estilo "thin" o "light"), siempre con el mismo grosor.
  - Ilustraciones de línea de moléculas reales: THC, CBD, CBG, el receptor CB1. Hazlas en SVG a partir de la estructura química real, no inventadas.
  - Etiquetas tipo "espécimen" (`SPEC-01 / RESEARCH`), numeración de sección `§ 01`, notas al margen y cinta adhesiva.
- **Composición**: rejilla editorial asimétrica de 12 columnas con titulares grandes (clamp hasta ~7rem) y mucho aire. Prohibido repetir rejillas de tarjetas iguales.
- **El personaje**: aparece como mascota en puntos concretos (hero, 404, pie y estado de éxito del formulario), nunca como decoración en todas partes.

## Tareas
1. **Logo limpio.** Pregunta a Saf si tiene el original en vector o en PNG con transparencia real. Si no lo tiene: quita el fondo de cuadros falso y el borde negro de `logo-character.png` (rembg o recorte manual + limpieza), recorta `logo-text.png` a su contenido y **vectoriza los dos a SVG** (potrace o vtracer) con una paleta reducida. Guarda los originales en `src/assets/brand/original/`.
2. Genera el favicon (SVG + PNG 32/180/512) y `site.webmanifest` a partir del personaje.
3. Crea los tokens en `src/styles/tokens.css`: color, tipografía (escala fluida), espaciado, radios (pequeños, casi rectos), sombras (duras, desplazadas tipo impreso, no difusas) y z-index.
4. Rediseña cada sección con la dirección de arte de arriba:
   - **Hero**: titular grande en serif, con una palabra subrayada a "rotulador". El personaje con una molécula de línea que se dibuja (la animación llega en el prompt 03). Elimina el canvas de partículas, `hero-bg.png` y vanilla-tilt.
   - **Misión**: formato editorial a dos columnas con capitular y la lista convertida en "protocolo" numerado (01–06) en mono.
   - **Impacto**: sustituye la rejilla de 6 tarjetas por una lista grande interactiva (filas a todo el ancho con número, título y descripción) o por un bento asimétrico con 1 destacado y 5 secundarios.
   - **Por qué unirse**: fusiónalo con el formulario como columna lateral ("Qué obtienes") para eliminar la segunda rejilla de tarjetas.
   - **Evento**: componente de evento con fecha, ciudad y estado (próximo/pasado). Pide los datos reales a Saf o deja un placeholder claramente marcado en `docs/TAREAS.md`.
   - **Formulario**: campos tipo "ficha", con etiquetas mono y foco visible con el color de acento.
   - **Footer**: grande, con el personaje, el lema y columnas de enlaces (incluidos los legales que crea el prompt 04).
5. Accesibilidad: contraste AA en todas las combinaciones, foco visible, tamaños táctiles ≥ 44 px y la jerarquía de encabezados correcta.

## Anti-checklist (si aparece algo de esto, el prompt no está terminado)
Emojis como iconos · glassmorphism · degradados morado/turquesa · partículas o redes de nodos · tarjetas con tilt/glare · "✔" en listas · rejilla 3×2 de tarjetas iguales · sombras difusas enormes · todo centrado · titulares tipo "Empowering the future of…".

## Verificación
- Capturas antes y después de cada sección (390 / 1440 px) en `docs/capturas/02/`.
- Lighthouse de accesibilidad ≥ 95 y sin peticiones a Google Fonts ni a CDNs de terceros.
- Commit `feat: nueva identidad visual estilo cuaderno de laboratorio` y push. Comprueba la web en producción.
