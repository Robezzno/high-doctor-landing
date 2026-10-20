/**
 * QA de rutas principales (prompt 09, QA.1): 8 idiomas × 2 viewports
 * (390 y 1440 px) sobre home y listado de noticias, con capturas en
 * `docs/capturas/09/`.
 *
 * Cada visita falla si:
 *  - hay errores de consola o excepciones de página;
 *  - hay respuestas HTTP >= 400 en subrecursos o navegaciones;
 *  - hay imágenes sin atributo `alt` (el alt vacío es válido: es decorativa);
 *  - hay imágenes con `width`/`height` ausentes (evita saltos de layout).
 */
import { expect, test, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const languages = ['en', 'es', 'de', 'fr', 'it', 'pt', 'nl', 'pl'] as const;
type Lang = (typeof languages)[number];

const CAPTURAS = fileURLToPath(new URL('../docs/capturas/09', import.meta.url));

/** Home por idioma: EN vive en `/`, el resto en `/{lang}/`. */
const homePath = (lang: Lang): string => (lang === 'en' ? '/' : `/${lang}/`);

/** El blog sólo existe en ES y EN; los demás idiomas caen al listado EN. */
const newsPath = (lang: Lang): string => (lang === 'es' ? '/noticias/' : '/en/news/');

const viewports = [
  { width: 390, height: 844 },
  { width: 1440, height: 900 },
];

async function openPage(
  page: Page,
  path: string,
  opts: { allowNav404?: boolean } = {},
): Promise<void> {
  const consoleErrors: string[] = [];
  const failedResponses: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(`pageerror: ${error.message}`));
  page.on('response', (response) => {
    if (response.status() < 400) return;
    // Una ruta inexistente DEBE devolver 404 real (buena práctica SEO, la
    // sirve la página 404 personalizada); lo que no puede fallar son los
    // subrecursos. `allowNav404` acepta el 404 del documento principal.
    if (opts.allowNav404 && response.request().resourceType() === 'document') return;
    failedResponses.push(`${response.status()} ${response.url()}`);
  });

  await page.goto(path, { waitUntil: 'networkidle' });

  // Las imágenes son lazy: se recorre la página para que todas carguen antes
  // de revisar alt/dimensiones y de hacer la captura completa.
  await page.evaluate(async () => {
    const step = window.innerHeight / 2;
    for (let y = 0; y <= document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForLoadState('networkidle');

  const altless = await page.$$eval('img', (images) =>
    images.filter((image) => !image.hasAttribute('alt')).map((image) => image.src),
  );
  expect(altless, `imágenes sin atributo alt: ${altless.join(', ')}`).toEqual([]);

  const dimensionless = await page.$$eval('img', (images) =>
    images
      .filter(
        (image) =>
          !image.hasAttribute('width') &&
          getComputedStyle(image).aspectRatio === 'auto' &&
          image.naturalWidth > 0,
      )
      .map((image) => image.src),
  );
  expect(
    dimensionless,
    `imágenes sin width/height ni aspect-ratio (riesgo de CLS): ${dimensionless.join(', ')}`,
  ).toEqual([]);

  expect(failedResponses, `respuestas >= 400: ${failedResponses.join(' | ')}`).toEqual([]);
  expect(consoleErrors, `errores de consola: ${consoleErrors.join(' | ')}`).toEqual([]);
}

async function capture(page: Page, name: string): Promise<void> {
  await mkdir(CAPTURAS, { recursive: true });
  await page.screenshot({ path: `${CAPTURAS}/${name}.png`, fullPage: true });
}

for (const viewport of viewports) {
  const suffix = `${viewport.width}`;

  test.describe(`rutas a ${viewport.width}px`, () => {
    test.use({ viewport });

    for (const lang of languages) {
      test(`home ${lang} (${suffix}px)`, async ({ page }) => {
        // Evita la redirección automática por idioma del navegador: cada test
        // visita su ruta explícita, con localStorage ya decidido.
        await page.addInitScript(() => {
          try {
            localStorage.setItem('preferredLang', 'en');
          } catch {
            /* modo privado: no pasa nada */
          }
        });
        await openPage(page, homePath(lang));
        await expect(page).toHaveTitle(/High Doctor Foundation/);
        await expect(page.locator('h1').first()).toBeVisible();
        await capture(page, `home-${lang}-${suffix}`);
      });

      test(`noticias ${lang} (${suffix}px)`, async ({ page }) => {
        await openPage(page, newsPath(lang));
        await expect(page.locator('h1').first()).toBeVisible();
        await capture(page, `noticias-${lang}-${suffix}`);
      });
    }

    test(`404 (${suffix}px)`, async ({ page }) => {
      await openPage(page, '/esta-pagina-no-existe/', { allowNav404: true });
      await expect(page).toHaveTitle(/404/i);
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('.nf__cta')).toBeVisible();
      await expect(page.locator('.nf__news')).toBeVisible();
      await capture(page, `404-${suffix}`);
    });
  });
}
