import bcrypt from 'bcryptjs';
import { newId } from '../utils/id.js';

/** Dummy accounts — every user's password is `password123`. */
export const DEMO_PASSWORD = 'password123';

const DEMO_USERS = [
  { username: 'alice', name: 'Alice Johnson', email: 'alice@acme.test', avatarColor: 'amber' },
  { username: 'bob', name: 'Bob Smith', email: 'bob@acme.test', avatarColor: 'blue' },
  { username: 'charlie', name: 'Charlie Davis', email: 'charlie@acme.test', avatarColor: 'pink' },
  { username: 'diana', name: 'Diana Prince', email: 'diana@acme.test', avatarColor: 'teal' },
  { username: 'evan', name: 'Evan Wright', email: 'evan@acme.test', avatarColor: 'violet' },
];

const initialsOf = (name) =>
  name
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

export async function buildSeedData() {
  const now = new Date();
  const iso = now.toISOString();
  const daysFromNow = (d) => new Date(now.getTime() + d * 86_400_000).toISOString();
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const users = DEMO_USERS.map((u) => ({
    id: newId(),
    ...u,
    initials: initialsOf(u.name),
    passwordHash,
    createdAt: iso,
  }));
  const [alice, bob, charlie, diana, evan] = users;

  const workspace = {
    id: newId(),
    name: 'Acme, Inc.',
    ownerId: alice.id,
    memberIds: users.map((u) => u.id),
    createdAt: iso,
  };

  const labels = [
    { id: newId(), name: 'Priority', color: 'pink' },
    { id: newId(), name: 'Design', color: 'sky' },
    { id: newId(), name: 'Research', color: 'yellow' },
    { id: newId(), name: 'Engineering', color: 'blue' },
    { id: newId(), name: 'Marketing', color: 'purple' },
    { id: newId(), name: 'Done', color: 'green' },
  ];
  const L = Object.fromEntries(labels.map((l) => [l.name, l.id]));

  const board = {
    id: newId(),
    title: 'Program Management',
    background: 'ocean',
    workspaceId: workspace.id,
    ownerId: alice.id,
    memberIds: [alice.id, bob.id, charlie.id, diana.id],
    starredBy: [alice.id],
    labels,
    createdAt: iso,
    updatedAt: iso,
  };

  const listDefs = ['Planning', 'Delivery', 'Evaluation and learning'];
  const lists = listDefs.map((title, position) => ({
    id: newId(),
    boardId: board.id,
    title,
    position,
    archived: false,
    createdAt: iso,
    updatedAt: iso,
  }));
  const [planning, delivery, evaluation] = lists;

  const card = (list, position, data) => ({
    id: newId(),
    boardId: board.id,
    listId: list.id,
    title: data.title,
    description: data.description || '',
    position,
    labelIds: data.labelIds || [],
    memberIds: data.memberIds || [],
    startDate: null,
    dueDate: data.dueDate || null,
    dueComplete: data.dueComplete || false,
    cover: data.cover || null,
    checklists: (data.checklists || []).map((cl) => ({
      id: newId(),
      title: cl.title,
      items: cl.items.map(([text, done]) => ({ id: newId(), text, done })),
    })),
    attachments: [],
    archived: false,
    createdBy: alice.id,
    createdAt: iso,
    updatedAt: iso,
  });

  const cards = [
    card(planning, 0, {
      title: 'Define Q4 program goals',
      description: 'Align with leadership on the three outcomes this quarter commits to.',
      labelIds: [L.Priority, L.Design],
      memberIds: [diana.id, alice.id],
    }),
    card(planning, 1, { title: 'Collect stakeholder feedback' }),
    card(planning, 2, {
      title: 'Research competitor onboarding flows',
      labelIds: [L.Research],
      memberIds: [charlie.id, bob.id],
    }),
    card(planning, 3, {
      title: 'Draft project roadmap',
      labelIds: [L.Research, L.Engineering],
      memberIds: [diana.id, bob.id],
      checklists: [{ title: 'Roadmap', items: [['Milestones', true], ['Owners', true], ['Risks', false]] }],
    }),
    card(delivery, 0, {
      title: 'Build kanban MVP',
      labelIds: [L.Research, L.Engineering],
      memberIds: [diana.id, bob.id],
      checklists: [{ title: 'MVP scope', items: [['Boards', true], ['Lists', true], ['Drag & drop', false]] }],
    }),
    card(delivery, 1, {
      title: 'Launch campaign assets',
      labelIds: [L.Marketing],
      memberIds: [alice.id],
      dueDate: daysFromNow(10),
    }),
    card(delivery, 2, { title: 'Weekly sync notes' }),
    card(delivery, 3, {
      title: 'Design system tokens',
      labelIds: [L.Engineering, L.Design],
      memberIds: [alice.id, evan.id].filter((id) => board.memberIds.includes(id)),
    }),
    card(delivery, 4, {
      title: 'Customer interviews',
      labelIds: [L.Priority],
      memberIds: [charlie.id, diana.id],
    }),
    card(evaluation, 0, {
      title: 'Sprint retrospective',
      memberIds: [charlie.id],
      dueDate: daysFromNow(-3),
      dueComplete: true,
      checklists: [{ title: 'Retro', items: [['What went well', true], ['What to improve', true]] }],
    }),
    card(evaluation, 1, {
      title: 'Measure activation metrics',
      labelIds: [L.Priority, L.Design],
      memberIds: [bob.id, alice.id, diana.id],
      dueDate: daysFromNow(3),
    }),
    card(evaluation, 2, {
      title: 'Publish lessons learned',
      labelIds: [L.Done],
      memberIds: [diana.id, charlie.id],
      checklists: [{ title: 'Publishing', items: [['Draft', true], ['Review', true], ['Edit', true], ['Publish', true]] }],
    }),
  ];

  const comments = [
    { id: newId(), cardId: cards[0].id, userId: bob.id, text: 'Let\'s keep the goals measurable.', createdAt: iso, updatedAt: iso },
    { id: newId(), cardId: cards[0].id, userId: diana.id, text: 'Agreed — I\'ll add KPIs.', createdAt: iso, updatedAt: iso },
  ];

  return {
    users,
    workspaces: [workspace],
    boards: [board],
    lists,
    cards,
    comments,
    activities: [
      {
        id: newId(),
        boardId: board.id,
        cardId: null,
        userId: alice.id,
        message: 'created this board',
        createdAt: iso,
      },
    ],
  };
}
