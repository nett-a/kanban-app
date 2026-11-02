import { expect, test } from '@playwright/test';
import { addCard, addList, card, createBoard, list, login, seedBoard, uniqueName } from './helpers.js';

test.describe('Boards and lists', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'alice');
  });

  test('TC-BOARD-01 creates a board and shows it on the home page', async ({ page }) => {
    const title = uniqueName('Roadmap');
    await createBoard(page, title);
    await page.getByRole('link', { name: 'Home' }).click();
    await expect(page.getByRole('link', { name: `Open board ${title}` }).first()).toBeVisible();
  });

  test('TC-BOARD-02 renames a board inline', async ({ page }) => {
    await seedBoard(page, { lists: [] });
    const renamed = uniqueName('Renamed');
    await page.getByRole('button', { name: 'Edit board title' }).click();
    await page.getByRole('textbox', { name: 'board title' }).fill(renamed);
    await page.keyboard.press('Enter');
    await expect(page.getByRole('button', { name: 'Edit board title' })).toHaveText(renamed);
    await page.reload();
    await expect(page.getByRole('button', { name: 'Edit board title' })).toHaveText(renamed);
  });

  test('TC-BOARD-03 stars a board and it appears under Starred boards', async ({ page }) => {
    const title = await seedBoard(page, { lists: [] });
    await page.getByRole('button', { name: 'Star board' }).click();
    await expect(page.getByRole('button', { name: 'Unstar board' })).toBeVisible();
    await page.getByRole('link', { name: 'Home' }).click();
    const starred = page.locator('section', { has: page.getByRole('heading', { name: 'Starred boards' }) });
    await expect(starred.getByRole('link', { name: `Open board ${title}` })).toBeVisible();
  });

  test('TC-LIST-01 adds, renames and archives lists', async ({ page }) => {
    await seedBoard(page, { lists: [] });
    await addList(page, 'Backlog');
    await addList(page, 'In Review');

    await list(page, 'Backlog').getByRole('button', { name: 'Edit list title' }).click();
    await page.getByRole('textbox', { name: 'list title' }).fill('Icebox');
    await page.keyboard.press('Enter');
    await expect(list(page, 'Icebox')).toBeVisible();

    await list(page, 'In Review').getByRole('button', { name: 'List actions for In Review' }).click();
    await page.getByRole('button', { name: 'Archive this list' }).click();
    await expect(list(page, 'In Review')).toHaveCount(0);

    // Restore from the board menu
    await page.getByRole('button', { name: 'Show menu' }).click();
    await page.getByRole('button', { name: 'Archived items' }).click();
    await page.getByRole('button', { name: 'Lists', exact: true }).click();
    await page.getByRole('button', { name: 'Restore' }).click();
    await expect(list(page, 'In Review')).toBeVisible();
  });

  test('TC-CARD-01 adds cards to a list and keeps them after reload', async ({ page }) => {
    await seedBoard(page, { lists: ['To Do'] });
    await addCard(page, 'To Do', 'Write specs');
    await addCard(page, 'To Do', 'Review PR');
    await page.reload();
    await expect(list(page, 'To Do').getByTestId('card')).toHaveCount(2);
    const titles = await list(page, 'To Do').getByTestId('card').allInnerTexts();
    expect(titles.map((t) => t.trim())).toEqual(['Write specs', 'Review PR']);
    await expect(card(page, 'Review PR')).toBeVisible();
  });

  test('TC-BOARD-04 rejects an empty list title (validation)', async ({ page }) => {
    await seedBoard(page, { lists: [] });
    await page.getByRole('button', { name: 'Add another list' }).click();
    await page.getByLabel('List name').fill('   ');
    await expect(page.getByRole('button', { name: 'Add list' })).toBeDisabled();
  });

  test('TC-BOARD-05 owner deletes a board', async ({ page }) => {
    const title = await seedBoard(page, { lists: [] });
    await page.getByRole('button', { name: 'Show menu' }).click();
    await page.getByRole('button', { name: 'Delete board' }).click();
    await page.getByRole('button', { name: 'Delete board permanently' }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('link', { name: `Open board ${title}` })).toHaveCount(0);
  });
});
