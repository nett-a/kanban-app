import { expect, test } from '@playwright/test';
import { addCard, card, list, login, openCard, seedBoard } from './helpers.js';

test.describe('Collaboration, search and filters', () => {
  test('TC-COLLAB-01 non-members cannot open a board until invited', async ({ browser }) => {
    const aliceCtx = await browser.newContext();
    const evanCtx = await browser.newContext();
    const alice = await aliceCtx.newPage();
    const evan = await evanCtx.newPage();

    await login(alice, 'alice');
    const title = await seedBoard(alice, { lists: ['Shared'], cards: ['Shared card'] });
    const boardUrl = alice.url();

    await login(evan, 'evan');
    await evan.goto(boardUrl);
    await expect(evan.getByRole('heading', { name: 'Board not found' })).toBeVisible();

    await alice.getByRole('button', { name: 'Share', exact: true }).click();
    const share = alice.getByRole('dialog', { name: 'Share board' });
    await share.getByLabel('Search people to invite').fill('evan');
    await share.getByRole('listitem').filter({ hasText: 'Evan Wright' }).getByRole('button', { name: 'Add' }).click();
    await expect(share.getByText('@evan')).toBeVisible();

    await evan.goto(boardUrl);
    await expect(evan.getByRole('button', { name: 'Edit board title' })).toHaveText(title);
    await expect(card(evan, 'Shared card')).toBeVisible();

    await aliceCtx.close();
    await evanCtx.close();
  });

  test('TC-COLLAB-02 a member can leave a board; only the owner can delete it', async ({ browser }) => {
    const aliceCtx = await browser.newContext();
    const bobCtx = await browser.newContext();
    const alice = await aliceCtx.newPage();
    const bob = await bobCtx.newPage();

    await login(alice, 'alice');
    await seedBoard(alice, { lists: [] });
    const boardUrl = alice.url();
    await alice.getByRole('button', { name: 'Share', exact: true }).click();
    await alice
      .getByRole('dialog', { name: 'Share board' })
      .getByRole('listitem')
      .filter({ hasText: 'Bob Smith' })
      .getByRole('button', { name: 'Add' })
      .click();

    await login(bob, 'bob');
    await bob.goto(boardUrl);
    await bob.getByRole('button', { name: 'Show menu' }).click();
    await expect(bob.getByRole('button', { name: 'Delete board' })).toHaveCount(0);
    await bob.getByRole('button', { name: 'Close menu' }).click();

    await bob.getByRole('button', { name: 'Share', exact: true }).click();
    await bob.getByRole('button', { name: 'Leave board' }).click();
    await expect(bob).toHaveURL(/\/$/);
    await bob.goto(boardUrl);
    await expect(bob.getByRole('heading', { name: 'Board not found' })).toBeVisible();

    await aliceCtx.close();
    await bobCtx.close();
  });

  test('TC-SEARCH-01 global search finds a card and opens it', async ({ page }) => {
    await login(page, 'alice');
    await seedBoard(page, { lists: ['To Do'] });
    const unique = `Searchable ${Date.now()}`;
    await addCard(page, 'To Do', unique);
    await page.getByRole('link', { name: 'Home' }).click();

    await page.getByLabel('Search boards and cards').fill(unique);
    await page.getByRole('button', { name: new RegExp(unique) }).click();
    await expect(page.getByRole('dialog', { name: `Card ${unique}` })).toBeVisible();
  });

  test('TC-FILTER-01 filters cards by keyword and by label', async ({ page }) => {
    await login(page, 'alice');
    await seedBoard(page, { lists: ['To Do'], cards: ['Alpha task', 'Beta task', 'Gamma'] });

    // Label "Beta task" green
    const dialog = await openCard(page, 'Beta task');
    await dialog.getByRole('button', { name: 'Labels', exact: true }).click();
    await page.getByRole('dialog', { name: 'Labels' }).getByLabel('Label green').click();
    await expect(page.getByRole('dialog', { name: 'Labels' }).getByLabel('Label green')).toBeChecked();
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');

    await page.getByRole('button', { name: /Filters/ }).click();
    const filter = page.getByRole('dialog', { name: 'Filter' });
    await filter.getByLabel('Keyword').fill('task');
    await expect(list(page, 'To Do').getByTestId('card')).toHaveCount(2);
    await expect(list(page, 'To Do')).toContainText('2 of 3 cards');

    await filter.getByLabel('Keyword').fill('');
    await filter.getByLabel('Filter by label green').click();
    await expect(filter.getByLabel('Filter by label green')).toBeChecked();
    await expect(list(page, 'To Do').getByTestId('card')).toHaveCount(1);
    await expect(card(page, 'Beta task')).toBeVisible();
    await expect(page.getByTestId('filter-count')).toHaveText('1');

    await filter.getByRole('button', { name: 'Clear all filters' }).click();
    await expect(list(page, 'To Do').getByTestId('card')).toHaveCount(3);
  });

  test('TC-ACT-01 activity log records card moves and comments', async ({ page }) => {
    await login(page, 'alice');
    await seedBoard(page, { lists: ['To Do', 'Done'], cards: ['Logged card'] });
    const dialog = await openCard(page, 'Logged card');
    await dialog.getByRole('button', { name: 'Move', exact: true }).click();
    const move = page.getByRole('dialog', { name: 'Move card' });
    await move.getByLabel('List').selectOption({ label: 'Done' });
    await move.getByRole('button', { name: 'Move' }).click();
    await dialog.getByRole('button', { name: 'Show details' }).click();
    await expect(dialog.getByTestId('activity-feed')).toContainText('moved this card from To Do to Done');
  });
});
