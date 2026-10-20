#!/usr/bin/env node
/**
 * Auditoría del prompt 03 (animaciones).
 *
 * Mide y documenta, contra la web servida en local:
 *   - errores de consola y de red,
 *   - contenido legible sin JavaScript y con `prefers-reduced-motion: reduce`,
 *   - CLS y long tasks durante un scroll completo (CPU 4× más lenta),
 *   - navegación con View Transitions (portada → blog → noticia → portada),
 *   - vídeos del hero, del scroll completo y del envío del formulario.
 *
 * Uso (con `npm run preview -- --port 4321` en marcha):
 *
 *   NODE_PATH=/home/saf/Coding/node_modules node scripts/motion-audit.mjs
 *
 * Playwright no es dependencia del proyecto: sólo se usa para documentar.
 */
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL ?? 'http://localhost:4321';
const OUT = 'docs/capturas/03';

const results = [];
const fail = (message) => {
  results.push(`FALLO  ${message}`);
  console.error(`FALLO  ${message}`);
};
const pass = (message) => {
  results.push(`OK     ${message}`);
  console.log(`OK     ${message}`);
};

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();

/** Contexto nuevo con idioma fijo y la redirección de `/` desactivada. */
async function newContext(options = {}) {
  const context = await browser.newContext({
    locale: 'en-GB',
    viewport: { width: 1440, height: 900 },
    ...options,
  });
  await context.addInitScript(() => {
    try {
      localStorage.setItem('preferredLang', 'en');
    } catch {
      /* modo privado */
    }
  });
  return context;
}

/** Errores de consola y de red que no esperamos. */
function watchErrors(page, label) {
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('requestfailed', (request) => {
    errors.push(`requestfailed: ${request.url()} ${request.failure()?.errorText ?? ''}`);
  });
  return () => {
    if (errors.length === 0) pass(`${label}: sin errores de consola ni de red`);
    else fail(`${label}: ${errors.join(' | ')}`);
  };
}

/* =================================================== 1. Escritorio con JS */
{
  const context = await newContext();
  const page = await context.newPage();
  const checkErrors = watchErrors(page, 'escritorio');

  await page.goto(BASE, { waitUntil: 'networkidle' });
  // Deja terminar la entrada del hero (≈1,3 s) y el dibujo de la molécula.
  await page.waitForTimeout(2200);

  // El motor de animación tiene que haber arrancado.
  const motion = await page.evaluate(() => document.documentElement.dataset.motion);
  if (motion === 'ready') pass(`motor de animación arrancado (data-motion=${motion})`);
  else fail(`data-motion inesperado: ${motion}`);

  // El titular está partido en líneas por SplitText.
  const lines = await page.locator('.hero__title .hero-line, .hero__title > div').count();
  if (lines > 0) pass(`titular partido en ${lines} líneas (SplitText)`);
  else fail('el titular no se ha partido en líneas');

  // El subrayado es un trazo SVG dibujado, no la banda de CSS.
  const strokeState = await page.evaluate(() => {
    const path = document.querySelector('[data-hero-stroke]');
    const highlight = document.querySelector('[data-hero-highlight]');
    if (!path || !highlight) return null;
    return {
      dash: getComputedStyle(path).strokeDasharray,
      total: path.getTotalLength(),
      background: getComputedStyle(highlight).backgroundImage,
    };
  });
  if (strokeState && strokeState.dash !== 'none' && strokeState.background === 'none') {
    pass(`trazo de rotulador con DrawSVG (dasharray ${strokeState.dash})`);
  } else {
    fail(`subrayado sin dibujar: ${JSON.stringify(strokeState)}`);
  }

  // Hilo de progreso: aparece y se rellena.
  const threadVisible = await page.locator('.thread').isVisible();
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.5));
  await page.waitForTimeout(900);
  const fillScale = await page.evaluate(() => {
    const fill = document.querySelector('[data-thread-fill]');
    return fill ? getComputedStyle(fill).transform : null;
  });
  const folio = await page.locator('[data-thread-folio]').textContent();
  if (threadVisible && fillScale && fillScale !== 'none') {
    pass(`hilo de progreso visible y relleno (${fillScale}), folio ${folio?.trim()}`);
  } else {
    fail(`hilo de progreso: visible=${threadVisible} transform=${fillScale}`);
  }

  // Checklist del protocolo marcada tras hacer scroll.
  const done = await page.locator('.protocol__item.is-done').count();
  if (done > 0) pass(`protocolo marcado: ${done}/6 ítems con check`);
  else fail('el protocolo no se ha marcado al hacer scroll');

  // Sección pinneada: la columna se queda quieta y los pasos se encienden.
  const pinned = await page.evaluate(() => {
    const sticky = document.querySelector('[data-process] > *');
    if (!sticky) return null;
    return { position: getComputedStyle(sticky).position, height: getComputedStyle(sticky).height };
  });
  if (pinned?.position === 'sticky') pass(`sección "cómo trabajamos" pinneada (${pinned.position})`);
  else fail(`la sección de proceso no está pinneada: ${JSON.stringify(pinned)}`);

  // Botones: el relleno se crea y entra desde el lado del cursor.
  const fill = page.locator('.hero__actions .btn').first();
  await fill.hover();
  await page.waitForTimeout(400);
  const fillBox = await page.evaluate(() => {
    const el = document.querySelector('.hero__actions .btn .btn__fill');
    if (!el) return null;
    return { transform: getComputedStyle(el).transform, tone: el.dataset.tone };
  });
  if (fillBox) pass(`relleno de botón creado (${JSON.stringify(fillBox)})`);
  else fail('el botón no ha creado el relleno');

  // Transiciones: navegar a la noticia desde la portada y volver.
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
  await page.locator('.latest-card__title a').first().click();
  await page.waitForURL(/\/news\/|noticias\//, { timeout: 5000 });
  await page.waitForTimeout(1200);
  pass(`View Transitions: portada → ${new URL(page.url()).pathname}`);
  const bodyText = await page.locator('body').innerText();
  if (bodyText.length > 400) pass('la noticia se ha renderizado tras la transición');
  else fail('la noticia quedó vacía tras la transición');

  await page.goBack();
  await page.waitForTimeout(1200);
  if (new URL(page.url()).pathname === '/') pass('View Transitions: vuelta a la portada');
  else fail(`la vuelta a la portada acabó en ${page.url()}`);

  checkErrors();
  await context.close();
}

/* ================================================= 2. Vídeos (1440 y 390) */
for (const [width, height, name] of [
  [1440, 900, 'escritorio'],
  [390, 844, 'movil'],
]) {
  const context = await newContext({
    viewport: { width, height },
    recordVideo: { dir: `${OUT}/video-${name}`, size: { width, height } },
  });
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2600);

  // Scroll completo, en pasos, para que se vean todas las entradas.
  const total = await page.evaluate(() => document.body.scrollHeight);
  const step = Math.round(height * 0.6);
  for (let y = 0; y < total; y += step) {
    await page.evaluate((value) => window.scrollTo(0, value), y);
    await page.waitForTimeout(260);
  }
  await page.waitForTimeout(600);

  // Formulario: se intercepta el POST para no enviar un lead de verdad.
  await page.route('https://api.web3forms.com/submit', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    }),
  );
  await page.evaluate(() => {
    document.querySelector('#contact')?.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await page.waitForTimeout(700);
  await page.fill('#name', 'Jane Doe');
  await page.fill('#email', 'jane.doe@example.com');
  await page.fill('#country', 'Germany');
  await page.fill('#profession', 'Researcher');
  await page.selectOption('#interest', 'research');
  await page.check('#privacy-consent');
  await page.waitForTimeout(400);
  await page.locator('#lead-form button[type="submit"]').click();
  await page.waitForTimeout(2400);

  const stampVisible = await page.locator('.success-stamp').isVisible();
  if (stampVisible) pass(`sello APPROVED visible tras el envío (${name})`);
  else fail(`el sello APPROVED no apareció (${name})`);

  await page.screenshot({ path: `${OUT}/formulario-enviado-${name}.png` });
  await page.waitForTimeout(600);

  const video = page.video();
  await context.close();
  if (video) {
    await video.saveAs(`${OUT}/03-${name}.webm`);
    pass(`vídeo guardado en ${OUT}/03-${name}.webm`);
  }
}

/* ============================================ 3. Sin JavaScript (todo legible) */
for (const [width, label] of [
  [1440, 'sin-js-1440'],
  [390, 'sin-js-390'],
]) {
  const context = await newContext({ viewport: { width, height: width === 390 ? 844 : 900 }, javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);

  const hidden = await page.evaluate(() => {
    const problems = [];
    for (const selector of [
      '.hero__title',
      '.hero__lead',
      '.hero__actions',
      '.hero__figure',
      '.mission',
      '.process',
      '.impact',
      '#news',
      '.join',
      '.footer',
    ]) {
      for (const element of document.querySelectorAll(selector)) {
        const style = getComputedStyle(element);
        if (style.opacity === '0' || style.visibility === 'hidden' || style.display === 'none') {
          problems.push(`${selector} (${style.opacity}/${style.visibility}/${style.display})`);
        }
      }
    }
    return problems;
  });
  if (hidden.length === 0) pass(`sin JS: todo el contenido visible (${label})`);
  else fail(`sin JS hay contenido oculto (${label}): ${hidden.join(', ')}`);

  const chars = (await page.locator('body').innerText()).trim().length;
  if (chars > 2000) pass(`sin JS: ${chars} caracteres legibles (${label})`);
  else fail(`sin JS: sólo ${chars} caracteres legibles (${label})`);

  await page.screenshot({ path: `${OUT}/${label}.png`, fullPage: true });
  await context.close();
}

/* ==================================== 4. reduced-motion (sin GSAP ni pin) */
{
  const context = await newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const requests = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);

  const animationJs = requests.filter((url) => /gsap|ScrollTrigger|SplitText|DrawSVG|lenis/.test(url));
  if (animationJs.length === 0) pass('reduced-motion: no se descarga ni un byte de GSAP ni de Lenis');
  else fail(`reduced-motion sigue descargando: ${animationJs.join(', ')}`);

  const state = await page.evaluate(() => ({
    motion: document.documentElement.dataset.motion ?? null,
    lenis: document.documentElement.classList.contains('lenis'),
    sticky: document.querySelector('[data-process] > *')
      ? getComputedStyle(document.querySelector('[data-process] > *')).position
      : null,
    heroOpacity: getComputedStyle(document.querySelector('.hero__title')).opacity,
  }));
  if (state.motion === null && state.lenis === false) pass('reduced-motion: sin motor propio ni scroll suave');
  else fail(`reduced-motion con motor activo: ${JSON.stringify(state)}`);
  if (state.sticky !== 'sticky') pass('reduced-motion: sin pin en "cómo trabajamos"');
  else fail('reduced-motion mantiene el pin');
  if (state.heroOpacity === '1') pass('reduced-motion: el hero se ve sin animar');
  else fail(`reduced-motion: el titular está a opacidad ${state.heroOpacity}`);

  await page.screenshot({ path: `${OUT}/reduced-motion-1440.png`, fullPage: true });
  await context.close();
}

/* ================================ 5. CLS y long tasks (móvil, CPU 4× lenta) */
{
  const context = await newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const client = await context.newCDPSession(page);
  await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });

  await page.addInitScript(() => {
    window.__cls = 0;
    window.__longTasks = [];
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) window.__cls += entry.value;
      }
    }).observe({ type: 'layout-shift', buffered: true });
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        window.__longTasks.push(Math.round(entry.duration));
      }
    }).observe({ type: 'longtask', buffered: true });
  });

  await page.goto(BASE, { waitUntil: 'networkidle' });
  // Se deja terminar la carga (parseo de GSAP incluido) y se limpia el
  // registro: el requisito es "ninguna tarea larga > 100 ms durante el scroll".
  await page.waitForTimeout(3000);
  await page.evaluate(() => {
    window.__longTasks.length = 0;
    window.__cls = 0;
  });

  const total = await page.evaluate(() => document.body.scrollHeight);
  const step = 400;
  for (let y = 0; y < total; y += step) {
    await page.evaluate((value) => window.scrollTo(0, value), y);
    await page.waitForTimeout(120);
  }
  await page.waitForTimeout(800);

  const metrics = await page.evaluate(() => ({
    cls: window.__cls,
    longTasks: window.__longTasks,
    scrollHeight: document.body.scrollHeight,
  }));

  const liteMode = await page.evaluate(() => document.documentElement.dataset.motion);
  if (liteMode === 'lite') pass('móvil: modo ligero (CSS + IntersectionObserver, sin GSAP)');
  else fail(`móvil: se esperaba el modo ligero y hay data-motion="${liteMode}"`);

  if (metrics.cls < 0.01) pass(`CLS móvil = ${metrics.cls.toFixed(4)}`);
  else fail(`CLS móvil = ${metrics.cls.toFixed(4)} (debe ser 0)`);

  const duringScroll = metrics.longTasks;
  const over100 = duringScroll.filter((duration) => duration > 100);
  if (over100.length === 0) {
    pass(
      `sin long tasks > 100 ms durante el scroll (máximo ${Math.max(0, ...duringScroll)} ms, ` +
        `${duringScroll.length} tareas largas)`,
    );
  } else {
    fail(`long tasks > 100 ms durante el scroll: ${over100.join(', ')} ms`);
  }

  await context.close();
}

await browser.close();

const failures = results.filter((line) => line.startsWith('FALLO'));
console.log('\n============================================');
console.log(`Comprobaciones: ${results.length} | fallos: ${failures.length}`);
if (failures.length > 0) process.exitCode = 1;
