#!/usr/bin/env node
/**
 * Capturas de sección para la documentación visual de cada prompt.
 *
 * Uso (con la web ya servida, p. ej. `npm run preview -- --port 4321`):
 *
 *   node scripts/screenshots.mjs --url http://localhost:4321/ --prefix antes
 *
 * Genera, por cada sección y cada ancho (390 y 1440 px), un PNG en
 * `docs/capturas/02/<prefix>-<seccion>-<ancho>.png` más una captura de página
 * completa por ancho.
 *
 * Playwright no es dependencia del proyecto (sólo se usa para documentar):
 * si no se resuelve, ejecuta el script con NODE_PATH apuntando a una
 * instalación existente, por ejemplo:
 *
 *   NODE_PATH=/home/saf/Coding/node_modules node scripts/screenshots.mjs ...
 */
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const args = new Map();
for (let i = 2; i < process.argv.length; i += 2) {
  args.set(process.argv[i].replace(/^--/, ''), process.argv[i + 1]);
}

const url = args.get('url') ?? 'http://localhost:4321/';
const prefix = args.get('prefix') ?? 'captura';
const outDir = args.get('out') ?? 'docs/capturas/02';
const widths = [390, 1440];

// Cada sección se identifica por el id que ya existe en el HTML.
const sections = ['top', 'mission', 'impact', 'join', 'mary-jane'];
const extraSelectors = { footer: 'footer.footer' };

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();

for (const width of widths) {
  // Contexto nuevo por ancho: localStorage limpio y siempre el mismo idioma
  // (EN), en vez de que la redirección automática decida según el navegador.
  const context = await browser.newContext({
    viewport: { width, height: width === 390 ? 844 : 900 },
    locale: 'en-GB',
  });
  await context.addInitScript(() => {
    try {
      localStorage.setItem('preferredLang', 'en');
    } catch {
      /* modo privado: la redirección simplemente no ocurre */
    }
  });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  // Las animaciones de aparición dejan las secciones en opacity 0 hasta que
  // entran en el viewport: se recorre la página para que se revelen todas.
  await page.evaluate(async () => {
    const step = window.innerHeight / 2;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 60));
    }
    window.scrollTo(0, 0);
    await new Promise((resolve) => setTimeout(resolve, 400));
  });

  // Barra de navegación: recorte de la parte alta del viewport (es `fixed`).
  await page.screenshot({
    path: `${outDir}/${prefix}-nav-${width}.png`,
    clip: { x: 0, y: 0, width, height: 120 },
  });

  for (const id of sections) {
    const locator = page.locator(`#${id}`);
    if ((await locator.count()) === 0) {
      console.warn(`aviso: no existe #${id}`);
      continue;
    }
    await locator.first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(250);
    await locator.first().screenshot({ path: `${outDir}/${prefix}-${id}-${width}.png` });
  }

  for (const [name, selector] of Object.entries(extraSelectors)) {
    const locator = page.locator(selector);
    if ((await locator.count()) === 0) {
      console.warn(`aviso: no existe ${selector}`);
      continue;
    }
    await locator.first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(250);
    await locator.first().screenshot({ path: `${outDir}/${prefix}-${name}-${width}.png` });
  }

  await page.screenshot({ path: `${outDir}/${prefix}-full-${width}.png`, fullPage: true });
  console.log(`OK ${width}px → ${outDir}/${prefix}-*.png`);
  await context.close();
}

await browser.close();
