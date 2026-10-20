/**
 * Hilo de progreso del margen y numeración `§ 0X`.
 *
 * El hilo es una línea fija a la izquierda que se rellena con el progreso de la
 * página (`scaleY`, sin repintar nada) y lleva encima el número de la sección
 * activa, que se cambia con un pequeño giro en Y cada vez que se entra en una.
 */
import { onLeavePage, type MotionLib } from './gsap';

export function initThread({ gsap, ScrollTrigger }: MotionLib): void {
  const thread = document.querySelector<HTMLElement>('[data-thread]');
  const fill = thread?.querySelector<HTMLElement>('[data-thread-fill]');
  const folio = thread?.querySelector<HTMLElement>('[data-thread-folio]');
  if (!thread || !fill || !folio) return;

  /* ------------------------------------------------- Progreso de lectura */
  gsap.fromTo(
    fill,
    { scaleY: 0 },
    {
      scaleY: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: document.documentElement,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.25,
      },
    },
  );

  /* ------------------------------------------------ Número de sección */
  const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-folio]'));
  if (sections.length === 0) return;

  let current = '';

  const setFolio = (value: string): void => {
    if (value === current) return;
    current = value;

    gsap
      .timeline()
      .to(folio, { yPercent: -70, opacity: 0, duration: 0.14, ease: 'power1.in' })
      .add(() => {
        folio.textContent = `§ ${value}`;
      })
      .fromTo(
        folio,
        { yPercent: 70, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 0.22, ease: 'power2.out' },
      );
  };

  // El primero pinta el número de partida (el hero, que empieza en 01).
  const first = sections[0]?.dataset.folio;
  if (first) {
    current = first;
    folio.textContent = `§ ${first}`;
  }

  for (const section of sections) {
    const value = section.dataset.folio;
    if (!value) continue;

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: 'top 45%',
      end: 'bottom 45%',
      onToggle: (self) => {
        if (self.isActive) setFolio(value);
      },
    });

    onLeavePage(() => trigger.kill());
  }
}
