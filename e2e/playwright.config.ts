/**
 * Configuración de Playwright para el QA del prompt 09.
 *
 * Sirve el build estático (`astro preview`) y corre contra él. Si el servidor
 * ya está arrancado, lo reutiliza (`reuseExistingServer`).
 *
 * Los tests NO se llaman `*.spec.ts` ni `*.test.ts` para que Vitest (que
 * también corre en la raíz con `npm test`) no los recoja: usan `*.e2e.ts`.
 *
 * Uso: `npm run test:e2e` (requiere antes `npm run build`).
 */
import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  testDir: import.meta.dirname,
  // Los ficheros usan sufijo `.e2e.ts` (ver abajo); el patrón por defecto de
  // Playwright sólo recoje `*.spec.*`/`*.test.*`.
  testMatch: '**/*.e2e.ts',
  // Capturas y trazas sólo cuando algo falla: no ensuciar el repo.
  outputDir: fileURLToPath(new URL('./.artifacts', import.meta.url)),
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4321',
    // Los tests de rutas fijan su propio viewport; este es el valor por defecto.
    viewport: { width: 1440, height: 900 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run preview -- --port 4321 --host 127.0.0.1',
    url: 'http://127.0.0.1:4321',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
