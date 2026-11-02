import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';

// Isolated data dir per run; env must be set before the app modules load.
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kanban-test-'));
process.env.NODE_ENV = 'test';
process.env.DB_FILE = path.join(tmp, 'db.json');
process.env.UPLOAD_DIR = path.join(tmp, 'uploads');

const { createApp } = await import('../src/app.js');
const { db } = await import('../src/database/jsonDb.js');
const { buildSeedData } = await import('../src/database/seed.js');
const { env } = await import('../src/config/env.js');

const XHR = { 'X-Requested-With': 'XMLHttpRequest' };
let app;

async function loginAs(username) {
  const agent = request.agent(app);
  await agent.post('/api/auth/login').set(XHR).send({ username, password: 'password123' }).expect(200);
  return agent;
}

before(async () => {
  await db.init(env.dbFile, { reset: true, seedFactory: buildSeedData });
  app = createApp();
});

after(async () => {
  await db.flush();
  fs.rmSync(tmp, { recursive: true, force: true });
});

describe('auth', () => {
  it('rejects invalid credentials with a generic message', async () => {
    const res = await request(app).post('/api/auth/login').set(XHR).send({ username: 'alice', password: 'nope' });
    assert.equal(res.status, 401);
    assert.equal(res.body.error.message, 'Invalid username or password');
  });

  it('sets an httpOnly SameSite=Strict cookie and never returns the password hash', async () => {
    const res = await request(app).post('/api/auth/login').set(XHR).send({ username: 'alice', password: 'password123' });
    assert.equal(res.status, 200);
    assert.equal(res.body.user.username, 'alice');
    assert.equal(res.body.user.passwordHash, undefined);
    const cookie = res.headers['set-cookie'][0];
    assert.match(cookie, /HttpOnly/i);
    assert.match(cookie, /SameSite=Strict/i);
  });

  it('requires authentication for protected routes', async () => {
    await request(app).get('/api/boards').expect(401);
  });

  it('blocks state-changing requests without the anti-CSRF header', async () => {
    const res = await request(app).post('/api/auth/login').send({ username: 'alice', password: 'password123' });
    assert.equal(res.status, 403);
  });
});

describe('boards, lists and cards', () => {
  it('runs the full kanban flow', async () => {
    const alice = await loginAs('alice');

    const { body: ws } = await alice.get('/api/workspaces').expect(200);
    const workspaceId = ws.workspaces[0].id;

    const { body: created } = await alice
      .post('/api/boards')
      .set(XHR)
      .send({ title: 'Test Board', workspaceId })
      .expect(201);
    const boardId = created.board.id;

    const { body: l1 } = await alice.post(`/api/boards/${boardId}/lists`).set(XHR).send({ title: 'To Do' }).expect(201);
    const { body: l2 } = await alice.post(`/api/boards/${boardId}/lists`).set(XHR).send({ title: 'Done' }).expect(201);

    const { body: c1 } = await alice.post(`/api/lists/${l1.list.id}/cards`).set(XHR).send({ title: 'A' }).expect(201);
    await alice.post(`/api/lists/${l1.list.id}/cards`).set(XHR).send({ title: 'B' }).expect(201);

    // Move A to the "Done" list
    await alice.patch(`/api/cards/${c1.card.id}/move`).set(XHR).send({ listId: l2.list.id, index: 0 }).expect(200);

    const { body: detail } = await alice.get(`/api/boards/${boardId}`).expect(200);
    const inDone = detail.cards.filter((c) => c.listId === l2.list.id);
    const inTodo = detail.cards.filter((c) => c.listId === l1.list.id);
    assert.deepEqual(inDone.map((c) => c.title), ['A']);
    assert.deepEqual(inTodo.map((c) => [c.title, c.position]), [['B', 0]]);

    // Reorder lists
    const { body: moved } = await alice.patch(`/api/lists/${l2.list.id}/move`).set(XHR).send({ index: 0 }).expect(200);
    assert.deepEqual(moved.lists.map((l) => l.title), ['Done', 'To Do']);

    // Checklist + comment
    const { body: cl } = await alice
      .post(`/api/cards/${c1.card.id}/checklists`)
      .set(XHR)
      .send({ title: 'Steps' })
      .expect(201);
    await alice
      .post(`/api/cards/${c1.card.id}/checklists/${cl.checklist.id}/items`)
      .set(XHR)
      .send({ text: 'one' })
      .expect(201);
    await alice.post(`/api/cards/${c1.card.id}/comments`).set(XHR).send({ text: 'Hello' }).expect(201);

    const { body: card } = await alice.get(`/api/cards/${c1.card.id}`).expect(200);
    assert.equal(card.card.badges.checkItems, 1);
    assert.equal(card.card.comments[0].text, 'Hello');
  });

  it('hides boards from non-members (404) and validates input', async () => {
    const alice = await loginAs('alice');
    const evan = await loginAs('evan');
    const { body } = await alice.get('/api/boards').expect(200);
    const boardId = body.boards[0].id;

    await evan.get(`/api/boards/${boardId}`).expect(404);
    await alice.post(`/api/boards/${boardId}/lists`).set(XHR).send({ title: '   ' }).expect(400);
    await alice.get('/api/boards/not-a-uuid').expect(400);
  });

  it('only lets the owner delete a board', async () => {
    const alice = await loginAs('alice');
    const bob = await loginAs('bob');
    const { body } = await alice.get('/api/boards').expect(200);
    const seeded = body.boards.find((b) => b.title === 'Program Management');
    await bob.delete(`/api/boards/${seeded.id}`).set(XHR).expect(403);
  });
});
