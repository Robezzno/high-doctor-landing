/**
 * Comportamiento de la web (idéntico al de `legacy/script.js`):
 * red de partículas del hero, vanilla-tilt, menú móvil, navbar al hacer scroll,
 * scroll suave y aparición de secciones. Sin i18n: cada idioma es su propia página.
 */

type VanillaTiltLike = {
  init: (elements: Element[], options: Record<string, unknown>) => void;
};

declare global {
  interface Window {
    VanillaTilt?: VanillaTiltLike;
  }
}

/* ---------------- Red de partículas del hero ---------------- */
const canvas = document.getElementById('network-canvas') as HTMLCanvasElement | null;

if (canvas) {
  const ctx = canvas.getContext('2d');

  if (ctx) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    class Particle {
      constructor(
        public x: number,
        public y: number,
        public directionX: number,
        public directionY: number,
        public size: number,
      ) {}

      draw(): void {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
        ctx.fillStyle = '#17C3B2';
        ctx.fill();
      }

      update(): void {
        if (this.x > canvas!.width || this.x < 0) this.directionX = -this.directionX;
        if (this.y > canvas!.height || this.y < 0) this.directionY = -this.directionY;
        this.x += this.directionX;
        this.y += this.directionY;
        this.draw();
      }
    }

    let particlesArray: Particle[] = [];

    function initParticles(): void {
      particlesArray = [];
      const numberOfParticles = (canvas!.height * canvas!.width) / 10000;
      for (let i = 0; i < numberOfParticles; i++) {
        const size = Math.random() * 2 + 1;
        const x = Math.random() * (innerWidth - size * 4) + size * 2;
        const y = Math.random() * (innerHeight - size * 4) + size * 2;
        const directionX = Math.random() * 1.5 - 0.75;
        const directionY = Math.random() * 1.5 - 0.75;
        particlesArray.push(new Particle(x, y, directionX, directionY, size));
      }
    }

    function connectParticles(): void {
      for (let a = 0; a < particlesArray.length; a++) {
        for (let b = a; b < particlesArray.length; b++) {
          const distance =
            (particlesArray[a].x - particlesArray[b].x) *
              (particlesArray[a].x - particlesArray[b].x) +
            (particlesArray[a].y - particlesArray[b].y) *
              (particlesArray[a].y - particlesArray[b].y);
          if (distance < (canvas!.width / 8) * (canvas!.height / 8)) {
            const opacityValue = 1 - distance / 15000;
            ctx!.strokeStyle = 'rgba(23, 195, 178,' + opacityValue + ')';
            ctx!.lineWidth = 1;
            ctx!.beginPath();
            ctx!.moveTo(particlesArray[a].x, particlesArray[a].y);
            ctx!.lineTo(particlesArray[b].x, particlesArray[b].y);
            ctx!.stroke();
          }
        }
      }
    }

    function animateParticles(): void {
      requestAnimationFrame(animateParticles);
      ctx!.clearRect(0, 0, innerWidth, innerHeight);
      for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
      }
      connectParticles();
    }

    window.addEventListener('resize', () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    });

    initParticles();
    animateParticles();
  }
}

/* ---------------- vanilla-tilt ---------------- */
if (typeof window.VanillaTilt !== 'undefined') {
  window.VanillaTilt.init(
    Array.from(document.querySelectorAll('.card, .benefit-item, .vision-card, .values-card')),
    {
      max: 15,
      speed: 400,
      glare: true,
      'max-glare': 0.2,
    },
  );
}

/* ---------------- Menú móvil ---------------- */
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

hamburger?.addEventListener('click', () => {
  navLinks?.classList.toggle('active');
  hamburger.classList.toggle('active');
});

document.querySelectorAll('.nav-links a').forEach((link) => {
  link.addEventListener('click', () => {
    navLinks?.classList.remove('active');
    hamburger?.classList.remove('active');
  });
});

/* ---------------- Navbar al hacer scroll ---------------- */
const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    navbar?.classList.add('scrolled');
  } else {
    navbar?.classList.remove('scrolled');
  }
});

/* ---------------- Scroll suave ---------------- */
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', (event) => {
    const targetId = anchor.getAttribute('href');
    if (!targetId || targetId === '#') return;
    const target = document.querySelector(targetId);
    if (target) {
      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

/* ---------------- Aparición de secciones ---------------- */
const revealElements = document.querySelectorAll('.reveal');
const revealOnScroll = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('active');
      observer.unobserve(entry.target);
    });
  },
  { threshold: 0.1, rootMargin: '0px 0px -50px 0px' },
);

revealElements.forEach((element) => revealOnScroll.observe(element));

export {};
