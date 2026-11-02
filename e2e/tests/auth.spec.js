import { expect, test } from '@playwright/test';
import { PASSWORD, login } from './helpers.js';

test.describe('Authentication (dummy login)', () => {
  test('TC-AUTH-01 redirects unauthenticated users to the login page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('button', { name: 'Log in' })).toBeVisible();
  });

  test('TC-AUTH-02 rejects wrong credentials with a generic error', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Username').fill('alice');
    await page.getByLabel('Password').fill('wrong-password');
    await page.getByRole('button', { name: 'Log in' }).click();
    await expect(page.getByRole('alert')).toHaveText('Invalid username or password');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('TC-AUTH-03 logs in with a demo account and lands on the boards page', async ({ page }) => {
    await login(page, 'alice');
    await expect(page.getByRole('heading', { name: 'Hi Alice 👋' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Open board Program Management' }).first()).toBeVisible();
  });

  test('TC-AUTH-04 demo account shortcut fills the form', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Use demo account bob' }).click();
    await expect(page.getByLabel('Username')).toHaveValue('bob');
    await expect(page.getByLabel('Password')).toHaveValue(PASSWORD);
  });

  test('TC-AUTH-05 session survives reload and logout ends it', async ({ page }) => {
    await login(page, 'alice');
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Hi Alice 👋' })).toBeVisible();

    await page.getByRole('button', { name: 'Account menu' }).click();
    await page.getByRole('button', { name: 'Log out' }).click();
    await expect(page).toHaveURL(/\/login$/);

    await page.goto('/');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('TC-AUTH-06 auth cookie is httpOnly (not readable from JavaScript)', async ({ page, context }) => {
    await login(page, 'alice');
    const cookies = await context.cookies();
    const session = cookies.find((c) => c.name === 'kanban_token');
    expect(session).toBeDefined();
    expect(session.httpOnly).toBe(true);
    expect(session.sameSite).toBe('Strict');
    expect(await page.evaluate(() => document.cookie)).not.toContain('kanban_token');
  });
});
