import { expect } from '@playwright/test';

export const PASSWORD = 'password123';

export async function login(page, username = 'alice') {
  await page.goto('/login');
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page.getByRole('heading', { name: /^Hi / })).toBeVisible();
}

export const uniqueName = (prefix) => `${prefix} ${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;

export async function createBoard(page, title) {
  await page.getByRole('button', { name: 'Create', exact: true }).first().click();
  const dialog = page.getByRole('dialog', { name: 'Create board' });
  await dialog.getByLabel('Board title').fill(title);
  await dialog.getByRole('button', { name: 'Create', exact: true }).click();
  await expect(page).toHaveURL(/\/b\/[0-9a-f-]{36}$/);
  await expect(page.getByRole('button', { name: 'Edit board title' })).toHaveText(title);
}

export async function addList(page, title) {
  const opener = page.getByRole('button', { name: 'Add another list' });
  if (await opener.isVisible()) await opener.click();
  await page.getByLabel('List name').fill(title);
  await page.getByRole('button', { name: 'Add list' }).click();
  await expect(list(page, title)).toBeVisible();
}

export const list = (page, title) => page.getByRole('region', { name: `List ${title}`, exact: true });

export const card = (page, title) => page.getByRole('button', { name: `Card ${title}`, exact: true });

export async function addCard(page, listTitle, cardTitle) {
  const column = list(page, listTitle);
  const opener = column.getByRole('button', { name: 'Add a card' });
  if (await opener.isVisible()) await opener.click();
  await column.getByLabel('Card title').fill(cardTitle);
  await column.getByRole('button', { name: 'Add card' }).click();
  await expect(column.getByRole('button', { name: `Card ${cardTitle}`, exact: true })).toBeVisible();
}

/** Creates a board with lists, and cards in the first list. */
export async function seedBoard(page, { lists = ['To Do', 'Doing', 'Done'], cards = [] } = {}) {
  const title = uniqueName('E2E Board');
  await createBoard(page, title);
  for (const l of lists) await addList(page, l);
  for (const c of cards) await addCard(page, lists[0], c);
  // Close any open composer
  await page.keyboard.press('Escape');
  return title;
}

/**
 * Mouse drag for @hello-pangea/dnd: it needs a real press, a small move past
 * the "sloppy click" threshold, then gradual movement to the target.
 */
export async function dragAndDrop(page, source, target, { offsetY = 0 } = {}) {
  const from = await source.boundingBox();
  const to = await target.boundingBox();
  const startX = from.x + from.width / 2;
  const startY = from.y + from.height / 2;
  const saved = waitForMove(page);
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + 5, startY + 5, { steps: 5 });
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2 + offsetY, { steps: 25 });
  await page.waitForTimeout(250);
  await page.mouse.up();
  await saved;
}

/** Resolves once the server has persisted a card/list move. */
export const waitForMove = (page) =>
  page.waitForResponse((res) => res.url().endsWith('/move') && res.request().method() === 'PATCH' && res.ok());

/** Keyboard drag (Space to lift, arrows to move, Space to drop) — the a11y path of @hello-pangea/dnd. */
export async function keyboardDrag(page, handle, keys) {
  const saved = waitForMove(page);
  await handle.focus();
  await page.keyboard.press('Space');
  await page.waitForTimeout(300);
  for (const key of keys) {
    await page.keyboard.press(key);
    await page.waitForTimeout(400); // let the move animation finish before the next key
  }
  await page.keyboard.press('Space');
  await saved;
}

export async function openCard(page, title) {
  await card(page, title).click();
  const dialog = page.getByRole('dialog', { name: `Card ${title}` });
  await expect(dialog).toBeVisible();
  return dialog;
}
