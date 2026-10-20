/**
 * Filas de Impacto.
 *
 * Cada fila entra con una máscara: el título sube desde detrás de su propia
 * línea (el `overflow: hidden` lo pone el CSS sólo cuando hay JS, así que sin
 * JavaScript el texto se lee tal cual). Al abrir una fila, el icono se dibuja
 * trazo a trazo y el panel aparece con un desplazamiento corto.
 */
import { finePointer } from './env';
import { onLeavePage, type MotionLib } from './gsap';

export function initImpact({ gsap }: MotionLib): void {
  const list = document.querySelector<HTMLElement>('[data-impact-list]');
  if (!list) return;

  const rows = Array.from(list.querySelectorAll<HTMLElement>('[data-impact-row]'));
  if (rows.length === 0) return;

  /* --------------------------------------------------------- Entrada */
  gsap.set(rows, { opacity: 0, y: 20 });

  gsap.to(rows, {
    opacity: 1,
    y: 0,
    duration: 0.6,
    ease: 'power2.out',
    stagger: 0.08,
    scrollTrigger: { trigger: list, start: 'top 82%', once: true },
  });

  const titles = rows
    .map((row) => row.querySelector<HTMLElement>('[data-impact-title]'))
    .filter((title): title is HTMLElement => title !== null);

  if (titles.length > 0) {
    gsap.fromTo(
      titles,
      { yPercent: 105, rotate: 1.5 },
      {
        yPercent: 0,
        rotate: 0,
        duration: 0.75,
        ease: 'power3.out',
        stagger: 0.08,
        scrollTrigger: { trigger: list, start: 'top 82%', once: true },
      },
    );
  }

  /* ------------------------------------------------- Apertura de fila */
  for (const row of rows) {
    const details = row.querySelector<HTMLDetailsElement>('details');
    const panel = row.querySelector<HTMLElement>('[data-impact-panel]');
    if (!details || !panel) continue;

    // La ilustración de la ficha: el icono del área, dibujado trazo a trazo.
    const drawingPaths = panel.querySelectorAll<SVGPathElement>('[data-impact-drawing] path');
    if (drawingPaths.length > 0) {
      gsap.set(drawingPaths, { drawSVG: '0%' });
    }

    const onToggle = (): void => {
      if (!details.open) return;

      gsap.fromTo(
        panel,
        { y: -10, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.42, ease: 'power2.out' },
      );

      if (drawingPaths.length > 0) {
        gsap.to(drawingPaths, {
          drawSVG: '100%',
          duration: 0.8,
          ease: 'power1.inOut',
          delay: 0.1,
          stagger: 0.08,
        });
      }
    };

    details.addEventListener('toggle', onToggle);
    onLeavePage(() => details.removeEventListener('toggle', onToggle));

    // Con ratón, la fila se abre sola al posarse un instante sobre ella (el
    // gesto de "pasar el ratón" del guion). En táctil no se engancha nada y
    // manda el toque nativo. La espera de 140 ms evita que se abran las filas
    // que sólo se cruzan de camino a otra cosa.
    if (finePointer()) {
      let intent = 0;
      const openSoon = (): void => {
        window.clearTimeout(intent);
        intent = window.setTimeout(() => {
          if (!details.open) details.open = true;
        }, 140);
      };
      const cancel = (): void => window.clearTimeout(intent);

      row.addEventListener('pointerenter', openSoon);
      row.addEventListener('pointerleave', cancel);
      onLeavePage(() => {
        window.clearTimeout(intent);
        row.removeEventListener('pointerenter', openSoon);
        row.removeEventListener('pointerleave', cancel);
      });
    }

    // La primera fila viene abierta de fábrica: si entra en pantalla abierta,
    // el dibujo se completa sin esperar a que la toquen.
    if (details.open) {
      gsap.to(drawingPaths, {
        drawSVG: '100%',
        duration: 0.8,
        ease: 'power1.inOut',
        scrollTrigger: { trigger: row, start: 'top 80%', once: true },
      });
    }
  }
}
