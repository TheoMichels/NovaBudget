import { test, expect } from './fixtures';

test('AC-01/02/04 local CRUD and settings survive reload with no Supabase network', async ({ page }) => {
  const cloudRequests: string[] = [];
  await page.route(/supabase\.(?:co|invalid)/, async route => { cloudRequests.push(route.request().url()); await route.abort(); });
  await page.addInitScript(() => {
    // Une session périmée historique ne doit pas provoquer de rafraîchissement cloud.
    if (!localStorage.getItem('test-seeded')) {
      localStorage.setItem('sb-synthetic-auth-token', JSON.stringify({ access_token: 'expired-synthetic', refresh_token: 'synthetic', expires_at: 1, user: { id: 'historical-user' } }));
      localStorage.setItem('@nova_savings_v3', JSON.stringify([{ id: 'legacy-local', name: 'Compte préexistant', category: 'securite', amount: 1200, rate: 0 }]));
      localStorage.setItem('@nova_future_projects_v3', JSON.stringify([{ id: 'legacy-project', title: 'Projet préexistant', category: 'autre', amount: 400, targetDate: '2027-01', isActive: true }]));
      localStorage.setItem('test-seeded', '1');
    }
  });
  await page.goto('/');
  await expect(page.getByTestId('storage-mode-badge')).toHaveText('Stockage local');
  await expect(page.getByText('Compte préexistant', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Gérer mon compte et synchronisation')).toHaveCount(0);
  await expect(page.getByLabel('Se déconnecter')).toHaveCount(0);

  await page.getByLabel("Ajouter un compte d'épargne", { exact: true }).click();
  await page.getByPlaceholder('Ex: Livret A BoursoBank, PEA Fortuneo...').fill('Épargne test');
  await page.getByPlaceholder('Ex: 5000').fill('2500');
  await page.getByText('Enregistrer', { exact: true }).filter({ visible: true }).click();
  await expect(page.getByText('Épargne test', { exact: true })).toBeVisible();
  await expect(page.getByPlaceholder('Ex: Livret A BoursoBank, PEA Fortuneo...')).toBeHidden();

  await page.getByLabel('Planifier une dépense', { exact: true }).click();
  await page.getByPlaceholder('Ex: Voyage Italie, Changement chaudière...').fill('Dépense test');
  await page.locator('input[placeholder="Ex: 3500"]:visible').fill('350');
  await page.getByText('Planifier', { exact: true }).click();
  await expect(page.getByText('Dépense test', { exact: true })).toBeVisible();
  await expect(page.getByPlaceholder('Ex: Voyage Italie, Changement chaudière...')).toBeHidden();

  await page.getByLabel('Ajouter une rentrée financière', { exact: true }).click();
  await page.getByPlaceholder("Ex: Prime de fin d'année, Vente moto, Remboursement...").fill('Rentrée test');
  await page.locator('input[placeholder="Ex: 3500"]:visible').fill('700');
  await page.getByText('Enregistrer', { exact: true }).filter({ visible: true }).click();
  await expect(page.getByLabel('Supprimer Rentrée test', { exact: true })).toBeVisible();
  await expect(page.getByPlaceholder("Ex: Prime de fin d'année, Vente moto, Remboursement...")).toBeHidden();

  await page.getByLabel('Augmenter de 100€', { exact: true }).click();
  await page.getByLabel('Seuil de sécurité en euros').fill('12345');
  await page.getByLabel('Seuil de sécurité en euros').blur();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('@nova_safety_cushion_v3'))).toBe('12345');
  await page.reload();
  for (const name of ['Compte préexistant', 'Projet préexistant', 'Épargne test', 'Dépense test', 'Rentrée test']) await expect(page.getByLabel(`Supprimer ${name}`, { exact: true })).toBeVisible();
  await expect(page.getByLabel('Seuil de sécurité en euros')).toHaveValue('12345');
  await expect(page.getByText(/^100\s*€$/)).toBeVisible();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('@nova_monthly_contribution_v3') ?? '{}').monthlyTotal)).toBe(100);

  for (const name of ['Épargne test', 'Dépense test', 'Rentrée test']) await page.getByLabel(`Supprimer ${name}`, { exact: true }).click();
  await page.reload();
  for (const name of ['Épargne test', 'Dépense test', 'Rentrée test']) await expect(page.getByLabel(`Supprimer ${name}`, { exact: true })).toHaveCount(0);
  await expect(page.getByText('Compte préexistant', { exact: true })).toBeVisible();
  await page.screenshot({ path: 'test-results/local-desktop.png', fullPage: true });
  expect(cloudRequests).toEqual([]);
});

test('AC-04 mobile 375px badge is readable without cloud actions or overflow', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  const badge = page.getByTestId('storage-mode-badge');
  await expect(badge).toHaveText('Stockage local');
  await expect(badge).toBeVisible();
  expect(await badge.evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.getByLabel('Gérer mon compte et synchronisation')).toHaveCount(0);
  await page.screenshot({ path: 'test-results/local-mobile.png', fullPage: true });
});

for (const width of [375, 1440]) {
  for (const [date, firstLabel, lastLabel] of [
    ['2026-10-15T12:00:00Z', 'Oct. 26', 'Oct. 29'],
    ['2026-09-15T12:00:00Z', 'Sept. 26', 'Sept. 29'],
  ]) {
    test(`AC-06 chart ticks never overlap and selection stays stable at ${width}px from ${firstLabel}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.clock.setFixedTime(new Date(date));
      await page.goto('/');
      const labels = page.locator('svg text').filter({ hasText: /^(Janv\.|Févr\.|Mars|Avr\.|Mai|Juin|Juil\.|Août|Sept\.|Oct\.|Nov\.|Déc\.) \d{2}$/ });
      await expect(labels.first()).toHaveText(firstLabel);
      await expect(labels.last()).toHaveText(lastLabel);
      await page.getByTestId('projection-chart').scrollIntoViewIfNeeded();
      const assertSpacing = async () => {
        const bounds = await labels.evaluateAll(nodes => nodes.map(node => {
          const box = node.getBoundingClientRect();
          return { text: node.textContent, left: box.left, right: box.right, width: box.width };
        }));
        expect(bounds.length).toBeGreaterThanOrEqual(2);
        for (let i = 1; i < bounds.length; i++) {
          expect(bounds[i].left - bounds[i - 1].right, `${bounds[i - 1].text} / ${bounds[i].text} overlap`).toBeGreaterThanOrEqual(0);
        }
      };
      await assertSpacing();
      const originalDate = await page.getByTestId('chart-date-headline').textContent();
      const originalCapital = await page.getByTestId('chart-capital-value').textContent();
      const box = await page.getByTestId('projection-chart').boundingBox();
      expect(box).not.toBeNull();
      if (!box) throw new Error('Graphique SVG introuvable');
      // Les abscisses des graduations extrêmes sont celles des mois 0 et 36.
      const firstX = Number(await labels.first().getAttribute('x'));
      const lastX = Number(await labels.last().getAttribute('x'));
      await page.mouse.click(box.x + firstX, box.y + 100);
      await expect(page.getByTestId('chart-capital-value')).toHaveText('0 €');
      await expect(page.getByTestId('chart-diff-badge')).toHaveText('Point de départ');
      await assertSpacing();
      await page.mouse.move(box.x + firstX, box.y + 100);
      await page.mouse.down();
      await page.mouse.move(box.x + lastX, box.y + 100, { steps: 12 });
      await page.mouse.up();
      await expect(page.getByTestId('chart-date-headline')).toHaveText(firstLabel.startsWith('Sept') ? '📅 Septembre 2029' : '📅 Octobre 2029');
      await expect(page.getByTestId('chart-capital-value')).toHaveText('0 €');
      await assertSpacing();
      // Le mois initial sélectionné par App est l’index 12 sur un horizon de 36 mois.
      await page.mouse.click(box.x + firstX + (lastX - firstX) / 3, box.y + 100);
      await expect(page.getByTestId('chart-date-headline')).toHaveText(originalDate ?? '');
      await expect(page.getByTestId('chart-capital-value')).toHaveText(originalCapital ?? '');
      await assertSpacing();
      await page.getByTestId('projection-chart').screenshot({ path: `test-results/ticks-${width}-${firstLabel.startsWith('Sept') ? 'september' : 'october'}.png` });
    });
  }
}

test('AC-07 annual interest is credited in January and follows the shared smooth curve', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.clock.setFixedTime(new Date('2026-10-15T12:00:00Z'));
  await page.addInitScript(() => {
    localStorage.setItem('@nova_savings_v3', JSON.stringify([{
      id: 'interest-step-account', name: 'Compte rémunéré', category: 'securite',
      amount: 100000, rate: 12, updatedAt: '2026-10-15T12:00:00.000Z',
    }]));
    localStorage.setItem('@nova_monthly_contribution_v3', JSON.stringify({ monthlyTotal: 0 }));
  });
  await page.goto('/');
  await page.getByTestId('projection-chart').scrollIntoViewIfNeeded();

  const linePath = await page.getByTestId('projection-chart-line').getAttribute('d');
  expect(linePath).toBeTruthy();
  expect(linePath).not.toMatch(/\bL\b/);

  const chart = page.getByTestId('projection-chart');
  const box = await chart.boundingBox();
  expect(box).not.toBeNull();
  if (!box) throw new Error('Graphique SVG introuvable');
  const svg = chart.locator('svg');
  const svgBox = await svg.boundingBox();
  const svgWidth = Number(await svg.getAttribute('width'));
  expect(svgBox).not.toBeNull();
  if (!svgBox || !svgWidth) throw new Error('Dimensions SVG introuvables');
  const december2026SvgX = 54 + (2.25 / 36) * (svgWidth - 54 - 24);
  await page.mouse.click(svgBox.x + (december2026SvgX / svgWidth) * svgBox.width, box.y + 100);
  await expect(page.getByTestId('chart-date-headline')).toHaveText('📅 Décembre 2026');
  await expect(page.getByTestId('chart-capital-value')).toHaveText('100 000 €');
  await expect(page.getByTestId('interest-chip-2027-01')).toHaveCount(0);
  const january2027SvgX = 54 + (3.25 / 36) * (svgWidth - 54 - 24);
  await page.mouse.click(svgBox.x + (january2027SvgX / svgWidth) * svgBox.width, box.y + 100);
  await expect(page.getByTestId('chart-date-headline')).toHaveText('📅 Janvier 2027');
  const january2027Interest = page.getByTestId('interest-chip-2027-01');
  await expect(january2027Interest).toContainText('Janv. 27');
  await expect(january2027Interest).toContainText('Intérêts 2026');
  await expect(january2027Interest).toContainText('+12 000 €');
  await expect(page.getByTestId('chart-capital-value')).toHaveText('112 000 €');
  await expect(page.getByTestId('kpi-projected-gains')).toContainText('+12 000 € intérêts');

  const monthNames = [
    'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet',
    'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
  ];
  for (const [offset, monthName] of monthNames.entries()) {
    const monthIndex = offset + 4;
    const monthSvgX = 54 + ((monthIndex + 0.25) / 36) * (svgWidth - 54 - 24);
    await page.mouse.click(svgBox.x + (monthSvgX / svgWidth) * svgBox.width, box.y + 100);
    await expect(page.getByTestId('chart-date-headline')).toHaveText(`📅 ${monthName} 2027`);
    await expect(page.getByTestId('kpi-projected-gains')).toContainText('+12 000 € intérêts');
  }

  // Allow for the wrapper's centered SVG hit-test offset while staying within
  // January's selection bucket.
  const january2028SvgX = 54 + (15.75 / 36) * (svgWidth - 54 - 24);
  const january2028X = svgBox.x + (january2028SvgX / svgWidth) * svgBox.width;
  await page.mouse.click(january2028X, box.y + 100);
  await expect(page.getByTestId('chart-date-headline')).toHaveText('📅 Janvier 2028');
  await expect(page.getByTestId('chart-capital-value')).toHaveText('125 440 €');
  await expect(page.getByTestId('kpi-projected-gains')).toContainText('+25 440 € intérêts');
  const january2028Interest = page.getByTestId('interest-chip-2028-01');
  await expect(january2028Interest).toContainText('Intérêts 2027');
  await expect(january2028Interest).toContainText('+13 440 €');
});
