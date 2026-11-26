import { expect, test } from '@playwright/test';

test('loads, shows links and switches language without console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('/');
  await expect(page.getByText('(tap to flip, hold to fidget)')).toBeVisible();
  for (const name of ['GitHub', 'Email', 'LinkedIn', 'CV']) {
    await expect(page.getByRole('link', { name })).toBeVisible();
  }
  // the card canvas sits above the page and lets the pointer through on hover,
  // so move the mouse over the control first, as a real user does
  const es = page.getByRole('button', { name: 'Español' });
  const box = await es.boundingBox();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await es.click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page.getByText('(toca para girar, mantén para jugar)')).toBeVisible();
  expect(errors).toEqual([]);
});
