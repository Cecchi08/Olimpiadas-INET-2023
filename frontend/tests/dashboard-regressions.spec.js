import { test, expect } from '@playwright/test';

const profile = { id: 'admin', email: 'admin@hospital.test', rol: 'Administrador' };
const tokenKey = 'codigoAzul.token';

async function setup(page) {
  await page.addInitScript(key => localStorage.setItem(key, 'saved-token'), tokenKey);
  await page.route('**/api/**', route => route.fulfill({ json:
    new URL(route.request().url()).pathname === '/api/auth/me' ? profile : []
  }));
}

test('restaura la sesión con loader y conserva la ruta al recargar', async ({ page }) => {
  await setup(page);
  let release;
  const pending = new Promise(resolve => { release = resolve; });
  let checks = 0;
  await page.route('**/api/auth/me', async route => {
    checks++;
    expect(route.request().headers().authorization).toBe('Bearer saved-token');
    await pending;
    await route.fulfill({ json: { usuario: profile, rol: profile.rol } });
  });
  await page.goto('/usuarios');
  await expect(page.getByRole('status')).toContainText('Validando sesión');
  await expect(page).toHaveURL(/\/usuarios$/);
  release();
  await expect(page.getByRole('heading', { name: 'Usuarios', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Pacientes', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Pacientes', exact: true })).toBeVisible();
  expect(checks).toBe(1);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Pacientes', exact: true })).toBeVisible();
  expect(checks).toBe(2);
  expect(await page.evaluate(key => localStorage.getItem(key), tokenKey)).toBe('saved-token');
});

test('un 401 inicial limpia la sesión y redirige desde la raíz', async ({ page }) => {
  await setup(page);
  await page.route('**/api/auth/me', route => route.fulfill({ status: 401, json: { error: 'Token expirado' } }));
  await page.goto('/');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('button', { name: 'Ingresar al sistema' })).toBeVisible();
  expect(await page.evaluate(key => localStorage.getItem(key), tokenKey)).toBeNull();
});

test('un fallo temporal permite reintentar sin perder el token', async ({ page }) => {
  await setup(page);
  let fail = true;
  await page.route('**/api/auth/me', route => route.fulfill(fail
    ? { status: 503, json: { error: 'Servidor temporalmente no disponible' } }
    : { json: profile }));
  await page.goto('/usuarios');
  await expect(page.getByRole('alert')).toContainText('temporalmente');
  await expect(page).toHaveURL(/\/usuarios$/);
  expect(await page.evaluate(key => localStorage.getItem(key), tokenKey)).toBe('saved-token');
  fail = false;
  await page.getByRole('button', { name: 'Reintentar' }).click();
  await expect(page.getByRole('heading', { name: 'Usuarios', exact: true })).toBeVisible();
});

test('la barra queda debajo del mapa y la consola no cambia sus dimensiones', async ({ page }) => {
  await setup(page);
  await page.goto('/dashboard');
  const map = page.getByLabel('Plano del hospital, coordenadas sobre un canvas de 1920 por 1080');
  const button = page.getByRole('button', { name: 'SIMULAR CÓDIGO AZUL' });
  await expect(button).toBeEnabled();
  const before = await map.boundingBox();
  const action = await button.boundingBox();
  expect(action.y).toBeGreaterThanOrEqual(before.y + before.height + 16);
  expect(await map.getByRole('button', { name: 'SIMULAR CÓDIGO AZUL' }).count()).toBe(0);
  const width = await page.getByRole('region', { name: 'Mapa y consola del hospital' }).boundingBox();
  expect(before.width / width.width).toBeGreaterThan(.7);
  await page.getByRole('log', { name: 'Eventos del sistema' }).evaluate(element => {
    element.textContent = 'Evento de consola\n'.repeat(1000);
  });
  expect(await map.boundingBox()).toEqual(before);
  await page.setViewportSize({ width: 390, height: 844 });
  const mobileMap = await map.boundingBox();
  const mobileAction = await button.boundingBox();
  expect(mobileAction.y).toBeGreaterThanOrEqual(mobileMap.y + mobileMap.height + 16);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
