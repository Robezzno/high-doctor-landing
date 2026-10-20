/**
 * Carga perezosa de GSAP y de sus plugins.
 *
 * El paquete de animación (GSAP + ScrollTrigger + SplitText + DrawSVG + Lenis)
 * no entra en el bundle de la página: se descarga con `import()` sólo cuando de
 * verdad se va a animar, es decir, nunca con `prefers-reduced-motion: reduce`
 * ni con ahorro de datos. La promesa se cachea para compartirla entre secciones.
 */
import type { SplitText as SplitTextClass } from 'gsap/SplitText';
import type { ScrollTrigger as ScrollTriggerClass } from 'gsap/ScrollTrigger';
// Los plugins amplían los tipos de GSAP (`drawSVG`, `mask`…); se importan sólo
// como tipos para que esa ampliación esté disponible en todo el proyecto.
import type {} from 'gsap/DrawSVGPlugin';

export type MotionGsap = typeof import('gsap').gsap;
export type MotionScrollTrigger = typeof ScrollTriggerClass;
export type MotionSplitText = typeof SplitTextClass;

export interface MotionLib {
  gsap: MotionGsap;
  ScrollTrigger: MotionScrollTrigger;
  SplitText: MotionSplitText;
}

let pending: Promise<MotionLib> | null = null;
let loaded: MotionLib | null = null;

/** Descarga y registra GSAP una sola vez por sesión de navegador. */
export function loadMotion(): Promise<MotionLib> {
  pending ??= (async () => {
    const [{ gsap }, { ScrollTrigger }, { SplitText }, { DrawSVGPlugin }] = await Promise.all([
      import('gsap'),
      import('gsap/ScrollTrigger'),
      import('gsap/SplitText'),
      import('gsap/DrawSVGPlugin'),
    ]);

    gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin);
    // Un tick más largo antes de considerar que el navegador se ha atascado:
    // evita saltos al volver de una pestaña en segundo plano.
    gsap.ticker.lagSmoothing(320, 33);

    loaded = { gsap, ScrollTrigger, SplitText };
    return loaded;
  })();

  return pending;
}

/* ------------------------------------------------------------- Limpieza */
type Cleanup = () => void;

const cleanups: Cleanup[] = [];

/** Registra una función que debe ejecutarse al salir de la página. */
export function onLeavePage(cleanup: Cleanup): void {
  cleanups.push(cleanup);
}

/**
 * Desmonta todo lo que ha creado el motor de animaciones. Se llama en
 * `astro:before-swap`: sin esto, cada navegación acumularía ScrollTriggers,
 * tweens infinitos y observadores sobre nodos que ya no existen.
 *
 * Es síncrono a propósito (el intercambio de documento no espera): si GSAP aún
 * no ha terminado de descargarse, no hay nada que matar porque `index.ts`
 * descarta el arranque tardío con un número de generación.
 */
export function disposeMotion(): void {
  while (cleanups.length > 0) {
    const cleanup = cleanups.pop();
    try {
      cleanup?.();
    } catch {
      /* una limpieza rota no debe impedir las demás */
    }
  }

  const lib = loaded;
  if (!lib) return;

  const { gsap, ScrollTrigger } = lib;
  for (const trigger of ScrollTrigger.getAll()) trigger.kill();
  for (const child of gsap.globalTimeline.getChildren(true, true, true)) child.kill();
  gsap.globalTimeline.clear();
}
