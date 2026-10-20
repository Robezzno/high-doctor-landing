/**
 * Protocolo 01–06 como checklist manuscrito.
 *
 * El texto nunca se oculta: lo que aparece, según se baja, es la marca de
 * verificación dibujada a mano y el resaltado del número. Así la lista se lee
 * igual sin JavaScript (sólo se pierde el gesto de ir marcándola).
 */
import { onLeavePage, type MotionLib } from './gsap';

export function initProtocol({ gsap, ScrollTrigger }: MotionLib): void {
  const template = document.querySelector<HTMLTemplateElement>('[data-protocol-check]');
  const items = Array.from(document.querySelectorAll<HTMLElement>('[data-protocol-item]'));
  if (!template || items.length === 0) return;

  const mark = (item: HTMLElement): void => {
    const num = item.querySelector<HTMLElement>('[data-protocol-num]');
    const slot = item.querySelector<HTMLElement>('[data-protocol-slot]');
    if (!slot) return;

    if (slot.childElementCount === 0) {
      const svg = template.content.firstElementChild?.cloneNode(true);
      if (svg instanceof SVGElement) slot.append(svg);
    }

    item.classList.add('is-done');
    num?.classList.add('is-done');

    gsap.fromTo(
      slot.querySelectorAll<SVGPathElement>('path'),
      { drawSVG: '0%' },
      { drawSVG: '100%', duration: 0.45, ease: 'power2.out', stagger: 0.12 },
    );

    // Un tic seco del número, como cuando se marca con boli.
    if (num) {
      gsap.fromTo(
        num,
        { scale: 1.25, rotate: -6 },
        { scale: 1, rotate: 0, duration: 0.45, ease: 'back.out(2.2)' },
      );
    }
  };

  for (const item of items) {
    const trigger = ScrollTrigger.create({
      trigger: item,
      start: 'top 78%',
      once: true,
      onEnter: () => mark(item),
    });

    onLeavePage(() => trigger.kill());
  }
}
