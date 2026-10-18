import { test, expect } from './fixtures';

test('AC-02/04 corrupted local data stays intact and dashboard can retry after recovery', async ({ page }) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('corrupt-seeded')) {
      localStorage.setItem('@nova_savings_v3', '{');
      sessionStorage.setItem('corrupt-seeded', '1');
    }
  });
  await page.goto('/');
  await expect(page.getByTestId('dashboard-error')).toContainText('Données locales');
  expect(await page.evaluate(() => localStorage.getItem('@nova_savings_v3'))).toBe('{');
  await page.getByLabel("Ajouter un compte d'épargne", { exact: true }).click();
  await page.getByPlaceholder('Ex: Livret A BoursoBank, PEA Fortuneo...').fill('Compte protégé');
  await page.getByPlaceholder('Ex: 5000').fill('100');
  await page.getByText('Enregistrer', { exact: true }).filter({ visible: true }).click();
  await expect(page.getByTestId('form-error')).toContainText('Données locales');
  expect(await page.evaluate(() => localStorage.getItem('@nova_savings_v3'))).toBe('{');
  await page.getByText('Annuler', { exact: true }).filter({ visible: true }).click();
  await page.evaluate(() => localStorage.setItem('@nova_savings_v3', '[]'));
  await page.getByTestId('dashboard-retry').click();
  await expect(page.getByTestId('dashboard-error')).toHaveCount(0);
  await expect(page.getByTestId('dashboard-empty')).toBeVisible();
});

test('AC-03 invalid expense input shows French feedback without persisting', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Planifier une dépense', { exact: true }).click();
  await page.getByPlaceholder('Ex: Voyage Italie, Changement chaudière...').fill('Saisie invalide');
  await page.locator('input[placeholder="Ex: 3500"]:visible').fill('-10');
  await page.getByTestId('form-submit').filter({ visible: true }).click();
  await expect(page.getByTestId('form-error')).toContainText('Valeurs invalides');
  expect(await page.evaluate(() => localStorage.getItem('@nova_expenses_v3'))).toBeNull();
  await page.locator('input[placeholder="Ex: 3500"]:visible').fill('1250,50');
  await page.getByTestId('form-submit').filter({ visible: true }).click();
  await expect(page.getByPlaceholder('Ex: Voyage Italie, Changement chaudière...')).toBeHidden();
  await page.reload();
  await expect(page.getByLabel('Supprimer Saisie invalide', { exact: true })).toBeVisible();
});
