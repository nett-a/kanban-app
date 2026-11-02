import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { card, list, login, openCard, seedBoard } from './helpers.js';

test.describe('Card details', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'alice');
    await seedBoard(page, { lists: ['To Do', 'Done'], cards: ['Detail card'] });
  });

  test('TC-CARD-02 edits title and description', async ({ page }) => {
    const dialog = await openCard(page, 'Detail card');
    await dialog.getByRole('button', { name: 'Edit card title' }).click();
    await dialog.getByRole('textbox', { name: 'card title' }).fill('Renamed card');
    await page.keyboard.press('Enter');
    // The dialog's accessible name follows the card title
    const renamed = page.getByRole('dialog', { name: 'Card Renamed card' });
    await expect(renamed.getByRole('button', { name: 'Edit card title' })).toHaveText('Renamed card');

    await renamed.getByRole('button', { name: 'Add a more detailed description…' }).click();
    await renamed.getByRole('textbox', { name: 'Description' }).fill('Line one\nLine two');
    await renamed.getByRole('button', { name: 'Save' }).first().click();
    await expect(renamed.getByTestId('card-description')).toHaveText('Line one\nLine two');

    await page.keyboard.press('Escape');
    await expect(card(page, 'Renamed card')).toBeVisible();
  });

  test('TC-CARD-03 adds labels, members and shows them on the card', async ({ page }) => {
    const dialog = await openCard(page, 'Detail card');
    await dialog.getByRole('button', { name: 'Labels', exact: true }).click();
    await page.getByRole('dialog', { name: 'Labels' }).getByLabel('Label green').click();
    await expect(page.getByRole('dialog', { name: 'Labels' }).getByLabel('Label green')).toBeChecked();
    await page.keyboard.press('Escape');
    await expect(dialog.getByTestId('card-modal-labels')).toBeVisible();

    await dialog.getByRole('button', { name: 'Join' }).click();
    await expect(dialog.getByRole('button', { name: 'Join' })).toHaveCount(0);

    await dialog.getByRole('button', { name: 'Close card' }).click();
    const tile = card(page, 'Detail card');
    await expect(tile.getByTestId('card-label')).toHaveCount(1);
    await expect(tile.getByTitle(/Alice Johnson/)).toBeVisible();
  });

  test('TC-CARD-04 checklist progress updates and shows as a badge', async ({ page }) => {
    const dialog = await openCard(page, 'Detail card');
    await dialog.getByRole('button', { name: 'Checklist', exact: true }).click();
    await page.getByRole('dialog', { name: 'Add checklist' }).getByRole('button', { name: 'Add' }).click();

    await dialog.getByRole('button', { name: 'Add an item' }).click();
    for (const item of ['Step one', 'Step two']) {
      await dialog.getByLabel('New checklist item').fill(item);
      await page.keyboard.press('Enter');
      await expect(dialog.getByRole('button', { name: 'Edit checklist item' }).filter({ hasText: item })).toBeVisible();
    }
    await dialog.getByLabel('Checklist item Step one').click();
    await expect(dialog.getByLabel('Checklist item Step one')).toBeChecked();
    await expect(dialog.getByTestId('checklist-progress')).toHaveText('50%');
    await dialog.getByLabel('Checklist item Step two').click();
    await expect(dialog.getByLabel('Checklist item Step two')).toBeChecked();
    await expect(dialog.getByTestId('checklist-progress')).toHaveText('100%');

    await page.keyboard.press('Escape');
    await expect(card(page, 'Detail card')).toContainText('2/2');
  });

  test('TC-CARD-05 adds, edits and deletes a comment', async ({ page }) => {
    const dialog = await openCard(page, 'Detail card');
    const activity = dialog.getByRole('region', { name: 'Activity' });
    await activity.getByLabel('Write a comment').fill('<b>not html</b> looks good');
    await activity.getByRole('button', { name: 'Save' }).click();
    const comment = activity.getByTestId('comment').first();
    // Rendered as text, never as HTML
    await expect(comment).toContainText('<b>not html</b> looks good');

    await comment.getByRole('button', { name: 'Edit' }).click();
    await comment.getByLabel('Edit comment').fill('Edited comment');
    await comment.getByRole('button', { name: 'Save' }).click();
    await expect(comment).toContainText('Edited comment');
    await expect(comment).toContainText('(edited)');

    await comment.getByRole('button', { name: 'Delete' }).click();
    await expect(activity.getByTestId('comment')).toHaveCount(0);

    await page.keyboard.press('Escape');
  });

  test('TC-CARD-06 sets a due date and marks it complete', async ({ page }) => {
    const dialog = await openCard(page, 'Detail card');
    await dialog.getByRole('button', { name: 'Dates', exact: true }).click();
    const dates = page.getByRole('dialog', { name: 'Dates' });
    await dates.getByLabel('Due date').fill('2020-01-15T10:00');
    await dates.getByRole('button', { name: 'Save' }).click();
    await expect(dialog.getByTestId('due-status')).toHaveText('Overdue');

    await dialog.getByLabel('Mark due date complete').click();
    await expect(dialog.getByLabel('Mark due date complete')).toBeChecked();
    await expect(dialog.getByTestId('due-status')).toHaveText('Complete');
  });

  test('TC-CARD-07 uploads, lists and deletes an attachment', async ({ page }) => {
    const file = path.join(os.tmpdir(), `e2e-note-${Date.now()}.txt`);
    fs.writeFileSync(file, 'hello attachment');

    const dialog = await openCard(page, 'Detail card');
    await dialog.getByRole('button', { name: 'Attachment', exact: true }).click();
    await page.getByTestId('attachment-input').setInputFiles(file);
    const item = dialog.getByTestId('attachment');
    await expect(item).toContainText(path.basename(file));

    // Download link is served only to authenticated board members
    const href = await item.getByRole('link', { name: 'Download' }).getAttribute('href');
    const res = await page.request.get(href);
    expect(res.status()).toBe(200);
    expect(await res.text()).toBe('hello attachment');

    await item.getByRole('button', { name: 'Delete' }).click();
    await expect(dialog.getByTestId('attachment')).toHaveCount(0);
    fs.rmSync(file, { force: true });
  });

  test('TC-CARD-08 rejects disallowed attachment types', async ({ page }) => {
    const file = path.join(os.tmpdir(), `e2e-evil-${Date.now()}.html`);
    fs.writeFileSync(file, '<script>alert(1)</script>');
    const dialog = await openCard(page, 'Detail card');
    await dialog.getByRole('button', { name: 'Attachment', exact: true }).click();
    await page.getByTestId('attachment-input').setInputFiles(file);
    await expect(page.getByRole('status').filter({ hasText: 'is not allowed' })).toBeVisible();
    await expect(dialog.getByTestId('attachment')).toHaveCount(0);
    fs.rmSync(file, { force: true });
  });

  test('TC-CARD-09 moves a card via the Move action', async ({ page }) => {
    const dialog = await openCard(page, 'Detail card');
    await dialog.getByRole('button', { name: 'Move', exact: true }).click();
    const move = page.getByRole('dialog', { name: 'Move card' });
    await move.getByLabel('List').selectOption({ label: 'Done' });
    await move.getByRole('button', { name: 'Move' }).click();
    await expect(dialog.getByText('in list Done')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(list(page, 'Done').getByRole('button', { name: 'Card Detail card' })).toBeVisible();
  });

  test('TC-CARD-10 archives, restores and finally deletes a card', async ({ page }) => {
    let dialog = await openCard(page, 'Detail card');
    await dialog.getByRole('button', { name: 'Archive', exact: true }).click();
    await expect(dialog.getByText('This card is archived.')).toBeVisible();
    await dialog.getByRole('button', { name: 'Send to board' }).click();
    await expect(dialog.getByText('This card is archived.')).toHaveCount(0);
    await dialog.getByRole('button', { name: 'Close card' }).click();
    await expect(card(page, 'Detail card')).toBeVisible();

    dialog = await openCard(page, 'Detail card');
    await dialog.getByRole('button', { name: 'Archive', exact: true }).click();
    await dialog.getByRole('button', { name: 'Delete', exact: true }).click();
    await dialog.getByRole('button', { name: 'Confirm delete' }).click();
    await expect(dialog).toHaveCount(0);
    await expect(card(page, 'Detail card')).toHaveCount(0);
  });

  test('TC-CARD-11 card URL is shareable (deep link opens the modal)', async ({ page }) => {
    await openCard(page, 'Detail card');
    const url = page.url();
    expect(url).toContain('?card=');
    await page.goto(url);
    await expect(page.getByRole('dialog', { name: 'Card Detail card' })).toBeVisible();
  });
});
