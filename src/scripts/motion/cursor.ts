/**
 * Cursor acompañante (opcional y sólo en escritorio).
 *
 * Es un aro pequeño que persigue al puntero con un pequeño retardo y crece sobre
 * lo interactivo. No sustituye al cursor del sistema: el nativo sigue ahí, así
 * que no se pierde precisión ni orientación en formularios o selección de texto.
 */
import { finePointer } from './env';
import { onLeavePage, type MotionLib } from './gsap';

export function initCursor({ gsap }: MotionLib): void {
  if (!finePointer()) return;

  const ring = document.createElement('div');
  ring.className = 'cursor-ring';
  ring.setAttribute('aria-hidden', 'true');
  document.body.append(ring);

  const xTo = gsap.quickTo(ring, 'x', { duration: 0.35, ease: 'power2.out' });
  const yTo = gsap.quickTo(ring, 'y', { duration: 0.35, ease: 'power2.out' });

  const interactive = 'a, button, summary, input, select, textarea, label, .btn';

  const onPointerMove = (event: PointerEvent): void => {
    xTo(event.clientX);
    yTo(event.clientY);
    ring.classList.add('is-visible');
  };

  const onPointerOver = (event: PointerEvent): void => {
    const target = event.target;
    const hit = target instanceof Element ? target.closest(interactive) : null;
    gsap.to(ring, { scale: hit ? 1.9 : 1, opacity: hit ? 0.75 : 0.5, duration: 0.3 });
  };

  const onLeave = (): void => {
    ring.classList.remove('is-visible');
  };

  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerover', onPointerOver, { passive: true });
  document.addEventListener('pointerleave', onLeave);

  onLeavePage(() => {
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerover', onPointerOver);
    document.removeEventListener('pointerleave', onLeave);
    ring.remove();
  });
}
