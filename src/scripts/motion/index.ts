/**
 * Motor de animaciones de la web.
 *
 * Reglas que se cumplen aquí, en este orden:
 *  1. Con `prefers-reduced-motion: reduce` o ahorro de datos no se descarga
 *     nada de GSAP: la web queda con los fundidos de 150 ms del CSS.
 *  2. Con `astro:before-swap` se desmonta todo (ScrollTriggers, tweens
 *     infinitos, Lenis, observadores) para que las View Transitions no
 *     acumulen trabajo entre páginas.
 *  3. El contenido nunca depende de JS: el estado inicial lo pone este módulo
 *     justo antes de animar, y el CSS deja siempre el estado final.
 */
import { markMotionReady, reducedMotion, saveData } from './env';
import { disposeMotion, loadMotion, onLeavePage, type MotionLib } from './gsap';
import { initHero } from './hero';
import { initImpact } from './impact';
import { initLiteMotion } from './lite';
import { initMicro } from './micro';
import { initProcess } from './process';
import { initProtocol } from './protocol';
import { initSections } from './sections';
import { initThread } from './thread';
import { initCursor } from './cursor';

/** Identificador de la página montada: descarta arranques que llegan tarde. */
let generation = 0;

/**
 * Desplazamiento suave. Sólo con puntero fino: en táctil el scroll nativo ya es
 * suave y Lenis sólo añadiría un frame de retardo.
 */
async function initSmoothScroll({ gsap, ScrollTrigger }: MotionLib): Promise<void> {
  const { default: Lenis } = await import('lenis');

  const lenis = new Lenis({ duration: 1.05, anchors: { offset: -80 } });

  lenis.on('scroll', ScrollTrigger.update);

  const raf = (time: number): void => {
    lenis.raf(time * 1000);
  };
  gsap.ticker.add(raf);
  gsap.ticker.lagSmoothing(0);

  onLeavePage(() => {
    gsap.ticker.remove(raf);
    lenis.destroy();
  });
}

/** Arranca (o reinicia) las animaciones de la página que acaba de entrar. */
export async function initMotion(): Promise<void> {
  const token = (generation += 1);

  // Sin movimiento permitido no se descarga ni un byte de más.
  if (reducedMotion() || saveData()) return;

  const mobile = window.matchMedia('(max-width: 55rem)').matches;
  const fine = window.matchMedia('(pointer: fine)').matches;

  // En móvil el repertorio se resuelve con CSS y un IntersectionObserver: no
  // se descarga GSAP (ver `lite.ts`). En páginas sin nada que animar (blog,
  // listados, noticias) se hace lo mismo: descargar 55 KB de motor para no
  // animar nada sería justo lo contrario del "import dinámico por componente".
  const hasMotionTargets = document.querySelector(
    '[data-hero], [data-impact-list], [data-process], [data-thread]',
  );

  if (mobile || !hasMotionTargets) {
    initLiteMotion();
    return;
  }

  const lib = await loadMotion();
  // Mientras se descargaba, el usuario pudo navegar a otra página: este arranque
  // ya no vale y el de la página nueva es el que manda.
  if (token !== generation) return;

  initHero(lib);
  initSections(lib);
  initThread(lib);
  initImpact(lib);
  initProtocol(lib);
  initProcess(lib);
  initMicro(lib);

  // Los píxeles de arriba ya están en su sitio: se levanta el estado inicial
  // que el script inline había fijado en el documento.
  markMotionReady();

  if (fine) {
    initCursor(lib);
    void initSmoothScroll(lib);
  }
}

// Una sola escucha para toda la sesión: el módulo se evalúa una vez aunque se
// navegue entre páginas con el router de Astro.
document.addEventListener('astro:before-swap', () => {
  generation += 1;
  disposeMotion();
});
