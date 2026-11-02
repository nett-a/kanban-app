import { expect, test } from '@playwright/test';
import { card, dragAndDrop, keyboardDrag, list, login, seedBoard } from './helpers.js';

const cardTitles = async (page, listTitle) =>
  (await list(page, listTitle).getByTestId('card').allInnerTexts()).map((t) => t.trim());

const listTitles = async (page) =>
  page.getByTestId('list').evaluateAll((els) => els.map((el) => el.getAttribute('aria-label').replace(/^List /, '')));

test.describe('Drag and drop', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'alice');
    await seedBoard(page, { lists: ['To Do', 'Doing', 'Done'], cards: ['Card A', 'Card B', 'Card C'] });
  });

  test('TC-DND-01 moves a card to another list with the mouse and persists it', async ({ page }) => {
    await dragAndDrop(page, card(page, 'Card A'), list(page, 'Doing'));
    await expect(list(page, 'Doing').getByRole('button', { name: 'Card Card A' })).toBeVisible();
    expect(await cardTitles(page, 'To Do')).toEqual(['Card B', 'Card C']);

    await page.reload();
    await expect.poll(() => cardTitles(page, 'Doing')).toEqual(['Card A']);
    expect(await cardTitles(page, 'To Do')).toEqual(['Card B', 'Card C']);
  });

  test('TC-DND-02 reorders cards inside the same list', async ({ page }) => {
    await dragAndDrop(page, card(page, 'Card C'), card(page, 'Card A'), { offsetY: -10 });
    await expect.poll(() => cardTitles(page, 'To Do')).toEqual(['Card C', 'Card A', 'Card B']);
    await page.reload();
    await expect.poll(() => cardTitles(page, 'To Do')).toEqual(['Card C', 'Card A', 'Card B']);
  });

  test('TC-DND-03 moves a card with the keyboard (accessibility)', async ({ page }) => {
    // Crosses two empty lists: exercises the expanded drop zone for empty lists.
    await keyboardDrag(page, card(page, 'Card B'), ['ArrowRight', 'ArrowRight']);
    await expect(list(page, 'Done').getByRole('button', { name: 'Card Card B' })).toBeVisible();
    await page.reload();
    await expect.poll(() => cardTitles(page, 'Done')).toEqual(['Card B']);
  });

  test('TC-DND-04 reorders lists and persists the new order', async ({ page }) => {
    // The list header is the drag handle; the keyboard gives a deterministic move.
    await keyboardDrag(page, page.getByLabel('Drag list Done'), ['ArrowLeft', 'ArrowLeft']);
    await expect.poll(() => listTitles(page)).toEqual(['Done', 'To Do', 'Doing']);
    await page.reload();
    await expect.poll(() => listTitles(page)).toEqual(['Done', 'To Do', 'Doing']);
  });

  test('TC-DND-05 dropping outside a list leaves the board unchanged', async ({ page }) => {
    const source = card(page, 'Card A');
    const box = await source.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + 20, box.y + 20, { steps: 5 });
    await page.mouse.move(1300, 850, { steps: 20 });
    await page.mouse.up();
    await page.waitForTimeout(400);
    expect(await cardTitles(page, 'To Do')).toEqual(['Card A', 'Card B', 'Card C']);
  });
});
