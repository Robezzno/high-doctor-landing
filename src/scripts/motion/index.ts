/**
 * Motor de animaciones de la web (rediseño 2026-11).
 *
 * Reglas, en este orden:
 *  1. Con `prefers-reduced-motion: reduce` o ahorro de datos no se anima nada:
 *     la página queda en su estado final, que es el del CSS.
 *  2. Las entradas son CSS + un IntersectionObserver (`reveal.ts`): no hace
 *     falta descargar GSAP, ni en móvil ni en escritorio.
 *  3. Con `astro:before-swap` se desmonta todo (observadores, Lenis) para que
 *     las View Transitions no acumulen trabajo entre páginas.
 *  4. El contenido nunca depende de JS: el script inline de Base sólo oculta
 *     la foto principal y el nombre en escritorio, y tiene temporizador.
 */
import { markMotionReady, reducedMotion, saveData } from './env';
import { disposeMotion, onLeavePage } from './gsap';
import { initReveal } from './reveal';

/** Identificador de la página montada: descarta arranques que llegan tarde. */
let generation = 0;

/** Desplazamiento suave sólo con ratón: en táctil el scroll nativo ya lo es. */
async function initSmoothScroll(token: number): Promise<void> {
  const { default: Lenis } = await import('lenis');
  if (token !== generation) return;
  const lenis = new Lenis({ duration: 1.05, anchors: { offset: -80 }, autoRaf: true });
  onLeavePage(() => lenis.destroy());
}

/** Arranca (o reinicia) las animaciones de la página que acaba de entrar. */
export async function initMotion(): Promise<void> {
  const token = (generation += 1);

  if (reducedMotion() || saveData()) return;

  initReveal();

  // Dos frames: el estado "armed" ya está pintado y la transición se ve.
  requestAnimationFrame(() => requestAnimationFrame(() => markMotionReady()));

  const fine = window.matchMedia('(pointer: fine)').matches;
  const wide = window.matchMedia('(min-width: 64.01rem)').matches;
  if (fine && wide) void initSmoothScroll(token);
}

document.addEventListener('astro:before-swap', () => {
  generation += 1;
  disposeMotion();
});
