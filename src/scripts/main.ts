/**
 * Comportamiento de la web (sin canvas de partículas ni vanilla-tilt):
 * menú móvil accesible, sombra de la barra al hacer scroll y aparición de
 * bloques al entrar en el viewport. Las animaciones de verdad llegan en el
 * prompt 03 con GSAP; aquí sólo hay lo mínimo para que la página funcione.
 */

/* ------------------------------------------------------ Menú móvil */
const nav = document.querySelector<HTMLElement>('[data-nav]');
const toggle = document.querySelector<HTMLButtonElement>('[data-nav-toggle]');
const panel = document.querySelector<HTMLElement>('[data-nav-panel]');

function setMenu(open: boolean): void {
  if (!nav || !toggle) return;
  nav.classList.toggle('nav--open', open);
  toggle.setAttribute('aria-expanded', String(open));
}

if (toggle && panel) {
  toggle.addEventListener('click', () => {
    setMenu(!nav?.classList.contains('nav--open'));
  });

  panel.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setMenu(false));
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && nav?.classList.contains('nav--open')) {
      setMenu(false);
      toggle.focus();
    }
  });

  // Si se pasa a escritorio con el menú abierto, se cierra: en escritorio el
  // panel es siempre visible y el estado abierto sobra.
  const desktop = window.matchMedia('(min-width: 55.01rem)');
  desktop.addEventListener('change', (event) => {
    if (event.matches) setMenu(false);
  });
}

/* --------------------------------- Desplegable de idioma (sin JS: nativo) */
const langDetails = document.querySelectorAll<HTMLDetailsElement>('details.langs');

for (const details of langDetails) {
  document.addEventListener('click', (event) => {
    if (!details.open) return;
    if (event.target instanceof Node && details.contains(event.target)) return;
    details.open = false;
  });

  details.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && details.open) {
      details.open = false;
      details.querySelector('summary')?.focus();
    }
  });
}

/* ------------------------------------------- Barra fija al hacer scroll */
const navbar = document.querySelector<HTMLElement>('[data-nav]');

if (navbar) {
  let ticking = false;
  const update = (): void => {
    navbar.classList.toggle('nav--stuck', window.scrollY > 12);
    ticking = false;
  };
  window.addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    },
    { passive: true },
  );
  update();
}

/* -------------------------------------- Aparición de bloques al hacer scroll */
const revealElements = document.querySelectorAll<HTMLElement>('.reveal');

if (revealElements.length > 0 && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    },
    { threshold: 0.08, rootMargin: '0px 0px -8% 0px' },
  );

  revealElements.forEach((element) => observer.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add('is-visible'));
}

export {};
