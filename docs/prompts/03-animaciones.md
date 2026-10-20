# 03 — Animaciones y microinteracciones

## Objetivo
Darle vida a la web con animaciones **intencionadas y con relación con la marca** (laboratorio, dibujo a mano, papel), no efectos de plantilla. La regla: cada animación explica algo o guía la vista. Si sólo "decora", fuera.

## Stack
GSAP + ScrollTrigger + SplitText + DrawSVG (todos los plugins de GSAP son gratis desde 2025) · Lenis para el scroll suave · View Transitions de Astro (`<ClientRouter />`) entre páginas. Carga GSAP sólo en el cliente y con import dinámico por componente.

## Animaciones a implementar
1. **Hero**
   - El titular entra por líneas con SplitText (máscara y desplazamiento en Y, stagger corto y ease `power4.out`).
   - La palabra clave se subraya con un trazo de rotulador SVG que se dibuja (DrawSVG).
   - La molécula de línea (THC/CBD) se dibuja trazo a trazo y luego "respira" muy suavemente.
   - El personaje entra con un ligero rebote y **sigue el cursor con los ojos/gafas** (parallax de 2–4 px, sólo con puntero fino).
2. **Scroll**
   - Numeración de sección `§ 01…` con contador que avanza y un hilo vertical en el margen que se rellena según el progreso de la página.
   - Lista de Impacto: cada fila se revela con una máscara. Al pasar el ratón (o al tocar en móvil), se expande y muestra la descripción con una mini ilustración.
   - Misión: el protocolo 01–06 se va "marcando" como un checklist manuscrito según se hace scroll.
   - Una sección *pinned* breve (≤ 1 pantalla de scroll extra) que cuente "cómo trabajamos" en 3 pasos: Investigar → Educar → Conectar, con la molécula transformándose entre pasos. Si en móvil da tirones, desactívala ahí.
3. **Microinteracciones**
   - Botones con relleno que entra desde la dirección del cursor y una flecha que se desplaza.
   - Enlaces con subrayado que se dibuja de izquierda a derecha.
   - Formulario: las etiquetas tipo ficha suben al enfocar y el envío correcto muestra al personaje con un "sello" de *APPROVED* estampado (escala + rotación + un leve shake).
   - Cursor personalizado opcional (un círculo pequeño que crece sobre los elementos interactivos), sólo en escritorio y sin ocultar el cursor nativo.
4. **Transiciones entre páginas** (home ↔ blog ↔ post): View Transitions con la imagen y el título del post como elementos compartidos (`transition:name`).
5. **Textura viva**: grano de papel animado muy sutil (cambio de `background-position` a 8 fps, coste mínimo).

## Rendimiento y accesibilidad (obligatorio)
- Con `prefers-reduced-motion: reduce`: sin Lenis, sin pin, sin parallax y sólo fundidos de opacidad de 150 ms. Pruébalo con la emulación de DevTools.
- Anima sólo `transform` y `opacity`. Nada de animar `width`, `top` ni `box-shadow` en bucles.
- Todo el contenido tiene que ser visible **sin JS** (estado final por defecto en el CSS y estado inicial aplicado por JS justo antes de animar). Así se evita el contenido invisible si falla el script.
- JS total de animaciones ≤ 60 KB gzip. Lighthouse de rendimiento en móvil ≥ 90. CLS = 0.
- Mata los ScrollTriggers al navegar con View Transitions (`astro:before-swap`) para que no se acumulen.

## Verificación
- Graba un GIF o vídeo corto del hero, el scroll completo y el envío del formulario en `docs/capturas/03/`.
- Prueba con reduced-motion activado y con JS desactivado: todo el contenido tiene que leerse.
- Revisa el Performance panel en móvil emulado (CPU 4× más lenta): sin long tasks > 100 ms durante el scroll.
- Commit `feat: animaciones con GSAP, Lenis y view transitions` y push.
