/**
 * Sección "cómo trabajamos": Investigar → Educar → Conectar.
 *
 * El pin lo hace `position: sticky` en el CSS, no `ScrollTrigger.pin`. Misma
 * sensación (la sección se queda quieta una pantalla mientras los tres pasos se
 * encienden), pero sin insertar espaciadores en el documento a mitad de carga:
 * cero riesgo de CLS y ninguna pelea con Lenis ni con las View Transitions.
 *
 * En móvil este módulo no se ejecuta: no hay pin y los pasos los enciende el
 * motor ligero de `lite.ts`.
 */
import { onLeavePage, type MotionLib } from './gsap';

export function initProcess({ gsap }: MotionLib): void {
  const stage = document.querySelector<HTMLElement>('[data-process]');
  const sticky = stage?.firstElementChild;
  if (!stage || !sticky) return;

  const stickyHeight = (): number =>
    (sticky as HTMLElement).offsetHeight || window.innerHeight;

  const steps = Array.from(stage.querySelectorAll<HTMLElement>('[data-process-step]'));
  const molecules = Array.from(stage.querySelectorAll<HTMLElement>('[data-process-molecule]'));
  const dots = Array.from(stage.querySelectorAll<HTMLElement>('[data-process-dot]'));
  if (steps.length < 2) return;

  const media = gsap.matchMedia();

  /* ------------------------------------------------ Escritorio: pin sticky */
  media.add('(min-width: 55.01rem)', () => {
    const timeline = gsap.timeline({
      defaults: { duration: 0.4, ease: 'power2.inOut' },
      scrollTrigger: {
        trigger: stage,
        start: 'top top+=96',
        // El guion dura exactamente lo que dura el pin: así el tercer paso se
        // enciende mientras la sección sigue quieta, no cuando ya se va.
        end: () => `+=${Math.max(1, stage.offsetHeight - stickyHeight())}`,
        scrub: 0.5,
      },
    });

    // Un respiro inicial: el primer paso se lee quieto al llegar.
    timeline.to({}, { duration: 0.35 });

    for (let index = 1; index < steps.length; index += 1) {
      const from = steps[index - 1];
      const to = steps[index];
      const fromMolecule = molecules[index - 1];
      const toMolecule = molecules[index];

      timeline
        .to({}, { duration: 0.16 }) // pausa para leer el paso
        .to(from ?? null, { opacity: 0.28 })
        .to(fromMolecule ?? null, { opacity: 0, scale: 0.85, rotate: -8 }, '<')
        .to(to ?? null, { opacity: 1 }, '<')
        .to(toMolecule ?? null, { opacity: 1, scale: 1, rotate: 0 }, '<')
        .to(dots[index] ?? null, { opacity: 1, scale: 1.55 }, '<')
        .to(dots[index - 1] ?? null, { opacity: 0.3, scale: 1 }, '<');
    }

    // Un respiro al final: el último paso se lee quieto antes de soltar el pin.
    timeline.to({}, { duration: 0.45 });

    return () => {
      timeline.scrollTrigger?.kill();
      timeline.kill();
    };
  });

  // En móvil no se llega aquí: el motor ligero (`lite.ts`) enciende los pasos
  // con `IntersectionObserver` y transiciones de CSS.
  onLeavePage(() => media.revert());
}
