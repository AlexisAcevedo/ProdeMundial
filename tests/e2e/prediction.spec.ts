import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Desactivar Service Worker globalmente para no romper mocks de Playwright
  await page.addInitScript(() => { window.E2E_TESTING = true; });

  // 1. Mock general para endpoints de rest/v1
  await page.route(/\/rest\/v1\/.*/, async (route) => {
    // Retorna arreglo vacío por defecto para todo (ej: users, leagues, group_standings)
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });

  // 2. Mock específico para matches
  await page.route(/\/rest\/v1\/matches/, async (route) => {
    if (route.request().method() === 'GET') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'mock-match-1',
            home_team: 'Argentina',
            away_team: 'Brasil',
            kickoff_time: tomorrow.toISOString(),
            status: 'not_started',
            home_score: null,
            away_score: null,
            group_letter: 'A',
            stage: 'Group Stage'
          }
        ]),
      });
    } else {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    }
  });

  // 3. Mock específico para predictions
  await page.route(/\/rest\/v1\/predictions/, async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    } else if (route.request().method() === 'POST' || route.request().method() === 'PATCH') {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 'pred-1', match_id: 'mock-match-1', home_score: 2, away_score: 1 }]),
      });
    } else {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    }
  });

  // 4. Interceptar todos los intentos de auth para simular respuestas rápidas
  await page.route(/\/auth\/v1\/.*/, async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
  });
});

test('Usuario puede cargar un pronóstico exitosamente', async ({ page }) => {
  // 2. Inyectar sesión falsa directa en window para bypass de useAuth()
  await page.addInitScript(() => {
    window.E2E_USER = {
      id: '12345678-1234-1234-1234-123456789012',
      aud: 'authenticated',
      role: 'authenticated',
      email: 'test@playwright.com',
      user_metadata: { name: 'E2E Tester' }
    };
  });

  await page.goto('/');

  // Validar que se rendericen los partidos
  await expect(page.getByText('Argentina')).toBeVisible({ timeout: 15000 });
  await expect(page.getByText('Brasil')).toBeVisible();

  // Identificar inputs del MatchCard. Tienen type="number".
  const inputs = page.locator('input[type="number"]');
  // Se espera 2 inputs por partido (Home, Away)
  await expect(inputs).toHaveCount(2);

  // Llenar inputs de resultado
  await inputs.nth(0).fill('2');
  await inputs.nth(1).fill('1');

  // Buscar el botón de "Guardar Pronóstico"
  const saveButton = page.getByRole('button', { name: /Guardar Pronóstico/i });
  await expect(saveButton).toBeEnabled();
  await saveButton.click();

  // Verificar toast
  const toast = page.locator('text=/¡Pronóstico guardado exitosamente!/i');
  await expect(toast).toBeVisible();
});

test('App renderiza la pantalla de login sin sesión', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Continuar con Google')).toBeVisible({ timeout: 10000 });
});
