/**
 * Comprobaciones de entorno del motor de animaciones.
 *
 * Nada de esto se evalúa en tiempo de build: son decisiones que dependen del
 * dispositivo, así que se consultan en el navegador justo antes de animar.
 */

/** El usuario ha pedido menos movimiento en su sistema operativo. */
export function reducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Ratón o trackpad (puntero fino), frente a pantallas táctiles. */
export function finePointer(): boolean {
  return window.matchMedia('(pointer: fine)').matches;
}

/** Ahorro de datos activado: no se descarga el paquete de animación. */
export function saveData(): boolean {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return connection?.saveData === true;
}

/**
 * Marca el documento como "motor de animación listo" (`data-motion="ready"`).
 * Es lo que deja de ocultar el hero: hasta este punto manda el estado inicial
 * que fija el script inline de `Base.astro` (atributo `armed`).
 */
export function markMotionReady(): void {
  const root = document.documentElement;
  if (root.dataset.motion === 'armed' || root.dataset.motion === undefined) {
    root.dataset.motion = 'ready';
  }
}
