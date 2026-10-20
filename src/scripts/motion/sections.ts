/**
 * Aparición de bloques al entrar en pantalla.
 *
 * Sustituye al `IntersectionObserver` que había en `main.ts`. El estado inicial
 * lo pone GSAP en el momento de armar la animación (no el CSS), así que sin
 * JavaScript —o si este paquete no llega a cargar— los bloques se leen tal cual.
 */
import type { MotionLib } from './gsap';

export function initSections({ gsap, ScrollTrigger }: MotionLib): void {
  const blocks = Array.from(
    document.querySelectorAll<HTMLElement>('.reveal, [data-news-section]'),
  ).filter((block) => block.offsetParent !== null || block.getClientRects().length > 0);

  if (blocks.length === 0) return;

  gsap.set(blocks, { opacity: 0, y: 16 });

  ScrollTrigger.batch(blocks, {
    start: 'top 90%',
    once: true,
    onEnter: (batch) => {
      gsap.to(batch, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: 'power2.out',
        stagger: 0.08,
        overwrite: true,
      });
    },
  });
}
