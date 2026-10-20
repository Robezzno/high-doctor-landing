/**
 * Animación de entrada del hero.
 *
 * Orden de lectura: primero el titular (líneas enmascaradas), luego el trazo de
 * rotulador sobre la palabra clave, la molécula dibujándose trazo a trazo, el
 * personaje con un rebote corto y, por último, el texto de apoyo. Todo son
 * `transform` y `opacity`: el layout no se toca ni un píxel (CLS = 0).
 */
import { finePointer } from './env';
import { onLeavePage, type MotionLib } from './gsap';

export function initHero({ gsap, SplitText }: MotionLib): void {
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  if (!hero) return;

  const title = hero.querySelector<HTMLElement>('[data-hero-title]');
  const lead = hero.querySelector<HTMLElement>('[data-hero-lead]');
  const actions = hero.querySelector<HTMLElement>('[data-hero-actions]');
  const figure = hero.querySelector<HTMLElement>('[data-hero-figure]');
  const portrait = hero.querySelector<HTMLElement>('[data-hero-portrait]');
  const molecule = hero.querySelector<SVGSVGElement>('[data-hero-molecule]');
  const stroke = hero.querySelector<SVGPathElement>('[data-hero-stroke]');
  const highlight = hero.querySelector<HTMLElement>('[data-hero-highlight]');

  /* ---------------------------------------------- 1. Titular por líneas */
  if (title) {
    // El CSS mantiene el titular oculto mientras el documento está `armed`
    // (script inline de Base.astro). Se revela aquí, en el mismo frame en que
    // las líneas pasan a su posición inicial: no hay parpadeo.
    gsap.set(title, { opacity: 1 });

    // Sólo la primera partición se anima: las siguientes (al cambiar el ancho o
    // al terminar de cargar las fuentes) dejan las líneas ya en su sitio.
    let firstSplit = true;

    SplitText.create(title, {
      type: 'lines',
      mask: 'lines',
      linesClass: 'hero-line',
      autoSplit: true,
      onSplit: (self) => {
        if (!firstSplit) {
          gsap.set(self.lines, { yPercent: 0, opacity: 1 });
          return undefined;
        }
        firstSplit = false;

        return gsap.from(self.lines, {
          yPercent: 110,
          duration: 0.95,
          ease: 'power4.out',
          stagger: 0.07,
        });
      },
    });
  }

  /* ------------------------------------------- 2. Subrayado a rotulador */
  if (stroke) {
    // El CSS trae el subrayado como banda de fondo (es el estado sin JS). Al
    // entrar aquí se cambia por el trazo SVG, que sí se puede dibujar.
    if (highlight) highlight.style.backgroundImage = 'none';

    gsap.fromTo(
      stroke,
      { drawSVG: '0%' },
      { drawSVG: '100%', duration: 0.7, ease: 'power2.inOut', delay: 0.5 },
    );
  }

  /* ------------------------------------------------- 3. Personaje y figura */
  const introDelay = 0.15;

  if (figure) {
    gsap.fromTo(
      figure,
      { y: 22, scale: 0.965, opacity: 0 },
      {
        y: 0,
        scale: 1,
        opacity: 1,
        duration: 0.85,
        ease: 'back.out(1.5)',
        delay: introDelay,
      },
    );
  }

  /* --------------------------------------------------- 4. Molécula viva */
  if (molecule) {
    const paths = molecule.querySelectorAll<SVGPathElement>('path');
    const labels = molecule.querySelectorAll<SVGTextElement>('text');

    gsap.set(labels, { opacity: 0 });
    gsap.fromTo(
      paths,
      { drawSVG: '0%' },
      { drawSVG: '100%', duration: 0.5, stagger: 0.055, ease: 'power1.inOut', delay: 0.45 },
    );
    gsap.to(labels, { opacity: 1, duration: 0.35, stagger: 0.05, delay: 0.95 });

    // Respiración: un desplazamiento de 2 px y medio grado, ida y vuelta.
    const breathing = gsap.to(molecule, {
      y: -2.5,
      rotate: 0.7,
      duration: 3.8,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut',
      delay: 1.3,
    });

    // Cuando el hero sale de pantalla no hay nada que respirar.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) breathing.play();
        else breathing.pause();
      },
      { threshold: 0 },
    );
    observer.observe(hero);
    onLeavePage(() => observer.disconnect());
  }

  /* ------------------------------------- 5. Texto de apoyo del titular */
  if (lead || actions) {
    gsap.fromTo(
      [lead, actions].filter(Boolean),
      { y: 16, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.65,
        stagger: 0.09,
        ease: 'power2.out',
        delay: introDelay + 0.2,
      },
    );
  }

  /* -------------------------------- 6. El personaje sigue al cursor (2–4 px) */
  // Sólo con ratón y sólo después del rebote de entrada: en táctil no hay
  // cursor que seguir y el efecto no aporta nada.
  if (portrait && finePointer()) {
    const xTo = gsap.quickTo(portrait, 'x', { duration: 0.55, ease: 'power2.out' });
    const yTo = gsap.quickTo(portrait, 'y', { duration: 0.55, ease: 'power2.out' });

    const start = window.setTimeout(() => {
      const onPointerMove = (event: PointerEvent): void => {
        const nx = event.clientX / window.innerWidth - 0.5;
        const ny = event.clientY / window.innerHeight - 0.5;
        xTo(nx * 6); // ±3 px
        yTo(ny * 4); // ±2 px
      };

      window.addEventListener('pointermove', onPointerMove, { passive: true });
      onLeavePage(() => {
        window.removeEventListener('pointermove', onPointerMove);
        gsap.set(portrait, { x: 0, y: 0 });
      });
    }, 1200);

    onLeavePage(() => window.clearTimeout(start));
  }
}
