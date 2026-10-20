/**
 * Accesibilidad (prompt 09, QA.2): `@axe-core/playwright` sobre las páginas
 * principales. El umbral acordado es 0 violaciones `serious` o `critical`;
 * las de impacto `moderate`/`minor` se reportan pero no fallan el test.
 */
import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const SCANS: Array<{ name: string; path: string }> = [
  { name: 'home EN', path: '/' },
  { name: 'home ES', path: '/es/' },
  { name: 'noticias ES', path: '/noticias/' },
  { name: 'news EN', path: '/en/news/' },
  { name: '404', path: '/esta-pagina-no-existe/' },
];

for (const { name, path } of SCANS) {
  test(`axe: ${name} sin violaciones serias o críticas`, async ({ page }) => {
    await page.goto(path, { waitUntil: 'networkidle' });
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const serious = results.violations.filter(
      (violation) => violation.impact === 'serious' || violation.impact === 'critical',
    );

    const summary = serious
      .map(
        (violation) =>
          `${violation.id} (${violation.impact}): ${violation.nodes.length} nodo(s) — ${violation.nodes
            .slice(0, 3)
            .map((node) => node.target.join(' '))
            .join(' ; ')}`,
      )
      .join('\n');

    expect(serious, `violaciones serias/críticas en ${name}:\n${summary}`).toEqual([]);
  });
}
