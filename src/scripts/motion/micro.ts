/**
 * Microinteracciones.
 *
 * - Botones: el relleno de rotulador entra desde el lado por el que llega el
 *   cursor (sólo `scale`/`translate`, sin tocar el layout).
 * - Envío correcto del formulario: el personaje entra con un rebote corto y el
 *   sello APPROVED se estampa con escala, rotación y un temblor breve.
 *
 * `src/scripts/contact-form.ts` no se toca: aquí sólo se observa el aviso de
 * estado que ya escribe, nunca el envío.
 */
import { onLeavePage, type MotionLib } from './gsap';

const FILL_COLOR = 'marker';

/** Crea el relleno de un botón y devuelve el par de funciones de entrada/salida. */
function decorateButton(
  gsap: MotionLib['gsap'],
  button: HTMLElement,
): { enter: (event: PointerEvent) => void; leave: () => void } | null {
  if (button.dataset.filled === 'true') return null;
  button.dataset.filled = 'true';

  const fill = document.createElement('span');
  fill.className = 'btn__fill';
  fill.dataset.tone = button.classList.contains('btn--marker') ? 'green' : FILL_COLOR;
  fill.setAttribute('aria-hidden', 'true');
  button.prepend(fill);

  // El botón ya es `position: relative` con `overflow: hidden` (ver global.css).
  const fromSide = (event: PointerEvent): { x: number; y: number } => {
    const rect = button.getBoundingClientRect();
    const left = event.clientX - rect.left;
    const top = event.clientY - rect.top;
    // El lado más cercano al punto de entrada decide por dónde asoma el relleno.
    const distances = [left, rect.width - left, top, rect.height - top];
    const directions = [
      { x: -1, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: -1 },
      { x: 0, y: 1 },
    ];
    return directions[distances.indexOf(Math.min(...distances))] ?? { x: 0, y: 1 };
  };

  return {
    enter: (event) => {
      const from = fromSide(event);
      button.classList.add('is-filled');
      gsap.fromTo(
        fill,
        { xPercent: from.x * 100, yPercent: from.y * 100 },
        { xPercent: 0, yPercent: 0, duration: 0.32, ease: 'power2.out' },
      );
    },
    leave: () => {
      button.classList.remove('is-filled');
      gsap.to(fill, { xPercent: 0, yPercent: -100, duration: 0.22, ease: 'power1.in' });
    },
  };
}

export function initMicro({ gsap }: MotionLib): void {
  /* ------------------------------------------------ Relleno de los botones */
  const buttons = Array.from(document.querySelectorAll<HTMLElement>('.btn'));

  for (const button of buttons) {
    const decorator = decorateButton(gsap, button);
    if (!decorator) continue;

    const enter = (event: PointerEvent): void => decorator.enter(event);
    const leave = (): void => decorator.leave();

    button.addEventListener('pointerenter', enter);
    button.addEventListener('pointerleave', leave);

    onLeavePage(() => {
      button.removeEventListener('pointerenter', enter);
      button.removeEventListener('pointerleave', leave);
    });
  }

  /* -------------------------------------- Sello APPROVED del formulario */
  const status = document.querySelector<HTMLElement>('#form-status');
  const mascot = document.querySelector<HTMLElement>('.success-mascot');
  const stamp = document.querySelector<HTMLElement>('[data-stamp]');
  if (!status || !mascot || !stamp) return;

  let celebrated = false;

  const celebrate = (): void => {
    if (celebrated) return;
    celebrated = true;

    gsap.fromTo(
      mascot,
      { opacity: 0, y: 14, scale: 0.86 },
      { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'back.out(1.8)' },
    );

    gsap
      .timeline({ delay: 0.25 })
      .fromTo(
        stamp,
        // El sello gira al estamparse y se queda con la inclinación de ficha
        // (-11°): GSAP escribe `rotate` en línea sobre el elemento y anula la
        // propiedad CSS `rotate`, así que el ángulo final se fija aquí.
        { opacity: 0, scale: 2.1, rotate: -26 },
        { opacity: 1, scale: 1, rotate: -11, duration: 0.36, ease: 'power4.in' },
      )
      .to(stamp, { x: -2, duration: 0.05 })
      .to(stamp, { x: 2, duration: 0.05 })
      .to(stamp, { x: -1, duration: 0.05 })
      .to(stamp, { x: 0, duration: 0.05 });
  };

  // El aviso de estado cambia de clase cuando el envío termina; se observa ese
  // cambio en vez de tocar la lógica del formulario.
  const observer = new MutationObserver(() => {
    if (status.classList.contains('form-status--success')) celebrate();
  });
  observer.observe(status, { attributes: true, attributeFilter: ['class'] });

  onLeavePage(() => observer.disconnect());
}
