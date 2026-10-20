/**
 * Motor "ligero" para móvil.
 *
 * En pantallas de menos de 55 rem no se descarga GSAP: el mismo repertorio de
 * gestos (el hero entra, la molécula se dibuja, el protocolo se marca, las
 * filas aparecen) se resuelve con transiciones y animaciones de CSS disparadas
 * por un `IntersectionObserver` nativo. Así el móvil no paga 55 KB de motor de
 * animación ni sus tareas largas, y el contenido se sigue leyendo sin JS.
 *
 * Lo que no hay en móvil: SplitText, parallax del personaje, pin, cursor propio
 * y scroll suave — ninguno aporta nada en una pantalla táctil pequeña.
 */
import { onLeavePage } from './gsap';

export function initLiteMotion(): void {
  document.documentElement.dataset.motion = 'lite';

  const observers: IntersectionObserver[] = [];

  /** Añade `is-in` a los elementos cuando asoman por el viewport. */
  const reveal = (selector: string): void => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>(selector));
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('is-in');
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: '0px 0px -6% 0px', threshold: 0.08 },
    );

    for (const element of elements) observer.observe(element);
    observers.push(observer);
  };

  reveal('.reveal, [data-news-section]');
  reveal('[data-impact-row]');
  reveal('[data-process-step]');

  /* --------------------------------- Checklist del protocolo, paso a paso */
  const checkTemplate = document.querySelector<HTMLTemplateElement>('[data-protocol-check]');
  const protocolItems = Array.from(document.querySelectorAll<HTMLElement>('[data-protocol-item]'));

  if (checkTemplate && protocolItems.length > 0) {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const item = entry.target as HTMLElement;
          const slot = item.querySelector<HTMLElement>('[data-protocol-slot]');

          if (slot && slot.childElementCount === 0) {
            const svg = checkTemplate.content.firstElementChild?.cloneNode(true);
            if (svg instanceof SVGElement) slot.append(svg);
          }

          item.classList.add('is-done');
          observer.unobserve(item);
        }
      },
      { rootMargin: '0px 0px -18% 0px', threshold: 0.4 },
    );

    for (const item of protocolItems) observer.observe(item);
    observers.push(observer);
  }

  onLeavePage(() => {
    for (const observer of observers) observer.disconnect();
  });
}
