/**
 * E2E del formulario (prompt 09, QA.3): el envío a Web3Forms se intercepta
 * para no mandar datos reales ni depender del servicio externo.
 *
 *  - Éxito: la API responde `{ success: true }` → mensaje de éxito y reset.
 *  - Error: la API responde 500 → mensaje de error y los campos se conservan.
 */
import { expect, test } from '@playwright/test';

const WEB3FORMS = '**/api.web3forms.com/submit';

async function fillForm(page: import('@playwright/test').Page): Promise<void> {
  await page.locator('#name').fill('Test HDF');
  await page.locator('#email').fill('test@example.com');
  await page.locator('#country').fill('Spain');
  await page.locator('#profession').fill('QA automation');
  await page.locator('#interest').selectOption('research');
  await page.locator('#privacy-consent').check();
}

test.describe('formulario de contacto (Web3Forms simulado)', () => {
  test.beforeEach(async ({ page }) => {
    // Evita la redirección por idioma del navegador.
    await page.addInitScript(() => {
      try {
        localStorage.setItem('preferredLang', 'en');
      } catch {
        /* modo privado */
      }
    });
    await page.goto('/', { waitUntil: 'networkidle' });
  });

  test('envío correcto muestra el mensaje de éxito y vacía el formulario', async ({ page }) => {
    let payload = '';
    await page.route(WEB3FORMS, async (route) => {
      payload = route.request().postData() ?? '';
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Mock' }),
      });
    });

    await fillForm(page);
    await page.locator('#lead-form button[type="submit"]').click();

    const status = page.locator('#form-status');
    await expect(status).toBeVisible();
    await expect(status).toContainText(/thank you/i);

    // El payload salió con la clave de acceso y los datos escritos.
    expect(payload).toContain('access_key=');
    expect(payload).toContain(encodeURIComponent('Test HDF'));

    // El formulario se resetea tras el éxito.
    await expect(page.locator('#name')).toHaveValue('');
  });

  test('fallo del envío muestra el mensaje de error y conserva los datos', async ({ page }) => {
    await page.route(WEB3FORMS, (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'Mock error' }),
      }),
    );

    await fillForm(page);
    await page.locator('#lead-form button[type="submit"]').click();

    const status = page.locator('#form-status');
    await expect(status).toBeVisible();
    await expect(status).toContainText(/went wrong/i);

    // No se borra lo escrito: el usuario puede reintentar sin volver a teclear.
    await expect(page.locator('#name')).toHaveValue('Test HDF');
    await expect(page.locator('#email')).toHaveValue('test@example.com');
  });
});
