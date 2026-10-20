/**
 * Comportamiento de la web: menú móvil accesible, desplegable de idioma, sombra
 * de la barra al hacer scroll y arranque del motor de animaciones.
 *
 * Con `<ClientRouter />` el documento se intercambia sin recargar: este módulo
 * se evalúa una sola vez, así que todo se engancha en `astro:page-load`, los
 * listeners globales se registran una única vez y los de nodo mueren con el nodo.
 */
import { initContactForm } from './contact-form';
import { initMotion } from './motion';

/** Referencias de la página actual, para los listeners globales. */
let navState: {
  nav: HTMLElement;
  toggle: HTMLButtonElement;
  setMenu: (open: boolean) => void;
} | null = null;

let globalListenersBound = false;

/* ------------------------------------------------------ Menú móvil */
function initNav(): void {
  const nav = document.querySelector<HTMLElement>('[data-nav]');
  const toggle = document.querySelector<HTMLButtonElement>('[data-nav-toggle]');
  const panel = document.querySelector<HTMLElement>('[data-nav-panel]');
  if (!nav || !toggle || !panel) return;

  const setMenu = (open: boolean): void => {
    nav.classList.toggle('nav--open', open);
    toggle.setAttribute('aria-expanded', String(open));
  };

  navState = { nav, toggle, setMenu };

  toggle.addEventListener('click', () => {
    setMenu(!nav.classList.contains('nav--open'));
  });

  panel.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setMenu(false));
  });

  // Si se pasa a escritorio con el menú abierto, se cierra: en escritorio el
  // panel es siempre visible y el estado abierto sobra.
  const desktop = window.matchMedia('(min-width: 55.01rem)');
  desktop.addEventListener('change', (event) => {
    if (event.matches) setMenu(false);
  });
}

/* --------------------------------- Desplegable de idioma (sin JS: nativo) */
function initLangDetails(): void {
  for (const details of document.querySelectorAll<HTMLDetailsElement>('details.langs')) {
    details.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && details.open) {
        details.open = false;
        details.querySelector('summary')?.focus();
      }
    });
  }
}

/* ------------------------------------------- Barra fija al hacer scroll */
let stickyHandler: (() => void) | null = null;

function initStickyNav(): void {
  const navbar = document.querySelector<HTMLElement>('[data-nav]');
  if (!navbar) return;

  let ticking = false;
  const update = (): void => {
    navbar.classList.toggle('nav--stuck', window.scrollY > 12);
    ticking = false;
  };

  // El nodo de la barra cambia en cada navegación: se sustituye el listener en
  // vez de acumular uno por página.
  if (stickyHandler) window.removeEventListener('scroll', stickyHandler);
  stickyHandler = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };
  window.addEventListener('scroll', stickyHandler, { passive: true });

  update();
}

/* -------------------------------- Listeners globales (una vez por sesión) */
function bindGlobalListeners(): void {
  if (globalListenersBound) return;
  globalListenersBound = true;

  // Escape cierra el menú móvil y devuelve el foco al botón que lo abrió.
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !navState) return;
    if (!navState.nav.classList.contains('nav--open')) return;
    navState.setMenu(false);
    navState.toggle.focus();
  });

  // Un clic fuera cierra el desplegable de idioma.
  document.addEventListener('click', (event) => {
    for (const details of document.querySelectorAll<HTMLDetailsElement>('details.langs')) {
      if (!details.open) continue;
      if (event.target instanceof Node && details.contains(event.target)) continue;
      details.open = false;
    }
  });
}

/* ------------------------------------------------------------- Arranque */
function boot(): void {
  bindGlobalListeners();
  initNav();
  initLangDetails();
  initStickyNav();
  // El formulario se vuelve a enganchar en cada navegación: con el router, el
  // nodo del formulario es nuevo cada vez.
  initContactForm();
  void initMotion();
}

// `astro:page-load` se dispara también en la carga inicial de la página y en
// cada navegación con el router.
document.addEventListener('astro:page-load', boot);

export {};
