/**
 * Entradas de la portada, sin GSAP: un IntersectionObserver añade `is-in` a
 * cada `[data-reveal]`, `[data-diagram]` y `[data-chapter]` cuando asoma, y el
 * CSS hace el resto (sólo opacidad y transform; ver global.css y cada
 * componente). Vale igual en móvil que en escritorio.
 *
 * Seguridad: el documento sólo se marca con `data-reveal-ready` cuando el
 * observador ya existe, y lo que está en pantalla al cargar entra en el primer
 * frame. Sin JS, o con movimiento reducido, nunca se oculta nada.
 */
import { onLeavePage } from './gsap';

const SELECTOR = '[data-reveal], [data-diagram], [data-chapter]';

export function initReveal(): void {
  const root = document.documentElement;
  const targets = Array.from(document.querySelectorAll<HTMLElement>(SELECTOR));
  if (targets.length === 0 || !('IntersectionObserver' in window)) return;

  // Escalonado: cada hijo directo de un `[data-reveal]` recibe su turno.
  for (const target of targets) {
    if (!target.hasAttribute('data-reveal')) continue;
    Array.from(target.children).forEach((child, index) => {
      (child as HTMLElement).style.setProperty('--i', String(Math.min(index, 8)));
    });
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -12% 0px', threshold: 0.12 },
  );

  // Lo que ya está a la vista no se oculta nunca: entra directamente.
  const fold = window.innerHeight;
  for (const target of targets) {
    const rect = target.getBoundingClientRect();
    if (rect.top < fold * 0.85 && rect.bottom > 0) target.classList.add('is-in');
    else observer.observe(target);
  }

  root.setAttribute('data-reveal-ready', '');

  onLeavePage(() => {
    observer.disconnect();
    root.removeAttribute('data-reveal-ready');
  });
}
