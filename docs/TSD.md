# Technical Specification Document (TSD)

**Produk:** FlowBoard — Aplikasi Kanban Tim
**Versi:** 1.0 · **Tanggal:** 2 November 2026
**Referensi:** [BRD.md](BRD.md) · [FSD.md](FSD.md) · [SECURITY.md](SECURITY.md)

---

## 1. Arsitektur

```
┌──────────────────────────── Browser ─────────────────────────────┐
│ React 19 SPA (Vite 8)                                            │
│  ├─ React Router 8 (routing, guard)                              │
│  ├─ TanStack Query 5 (server state, cache, optimistic update)    │
│  ├─ @hello-pangea/dnd (drag & drop list/card, mouse + keyboard)  │
│  └─ Tailwind CSS 4 (styling)                                     │
└───────────────┬──────────────────────────────────────────────────┘
                │  fetch /api/*  (same-origin, cookie httpOnly JWT,
                │                 header X-Requested-With)
┌───────────────▼──────────────────────────────────────────────────┐
│ Node.js 24 + Express 5 (REST API)                                │
│  routes → middlewares (auth, csrf, validate, upload, rate limit) │
│        → controllers → services (business rules & authorization) │
│        → repositories → JsonDatabase (in-memory + atomic write)  │
└───────────────┬──────────────────────────────────────────────────┘
                │
        backend/data/db.json        backend/uploads/<uuid>.<ext>
```

- **Dev:** Vite (port 5173) mem-proxy `/api` ke Express (port 4000) → satu origin, cookie `SameSite=Strict` bekerja tanpa CORS rumit.
- **Prod:** `npm start` mem-build frontend lalu Express menyajikan `frontend/dist` + API di satu port.

## 2. Tech Stack

| Lapisan | Teknologi | Versi |
|---------|-----------|-------|
| Runtime | Node.js | ≥ 22.12 (diuji di 24.13) |
| Backend framework | Express | 5.x |
| Validasi | Zod | 4.x |
| Auth | jsonwebtoken (HS256) + bcryptjs | 9.x / 3.x |
| Keamanan HTTP | helmet, cors, express-rate-limit, cookie-parser | terbaru |
| Upload | multer | 2.x |
| Frontend | React + React DOM | 19.x |
| Build tool | Vite + @vitejs/plugin-react | 8.x / 6.x |
| Styling | Tailwind CSS + @tailwindcss/vite | 4.x |
| Routing | react-router | 8.x |
| Server state | @tanstack/react-query | 5.x |
| Drag & drop | @hello-pangea/dnd | 18.x |
| Ikon | lucide-react | 1.x |
| Test API | node:test + supertest | bawaan / 7.x |
| Test E2E | @playwright/test | 1.6x |
| Lint | ESLint 10 + react-hooks 7 (aturan React Compiler) | |

## 3. Struktur Folder

Monorepo dengan **npm workspaces** (`backend`, `frontend`, `e2e`).

```
kanban-app/
├── package.json                # root scripts & workspaces
├── README.md
├── docs/                       # BRD, FSD, TSD, SECURITY, E2E-TESTING
├── backend/
│   ├── .env.example
│   ├── data/                   # db.json (dibuat otomatis dari seed)
│   ├── uploads/                # file lampiran (nama acak UUID)
│   ├── src/
│   │   ├── server.js           # bootstrap: init DB, listen, graceful shutdown
│   │   ├── app.js              # Express app & middleware pipeline
│   │   ├── config/             # env.js (konfigurasi tervalidasi), constants.js
│   │   ├── database/           # jsonDb.js (engine), seed.js, seed.cli.js
│   │   ├── repositories/       # data-access layer per koleksi
│   │   ├── services/           # business logic + otorisasi
│   │   ├── controllers/        # HTTP ↔ service (tipis)
│   │   ├── routes/             # definisi endpoint per resource
│   │   ├── middlewares/        # auth, csrf, validate, upload, rateLimit, error
│   │   ├── validators/         # skema Zod per resource
│   │   └── utils/              # AppError, id, position
│   └── tests/                  # API integration tests (node:test)
├── frontend/
│   ├── index.html, vite.config.js, eslint.config.js
│   ├── public/
│   └── src/
│       ├── main.jsx, App.jsx, index.css
│       ├── api/                # client.js (fetch wrapper) + index.js (endpoint)
│       ├── context/            # AuthContext, ToastContext
│       ├── hooks/              # queries.js (TanStack Query), usePopover.js
│       ├── routes/             # router.jsx, guards.jsx
│       ├── pages/              # LoginPage, BoardsPage, BoardPage, NotFoundPage
│       ├── components/
│       │   ├── ui/             # Popover, Modal, Avatar, InlineEdit, AutoTextarea, …
│       │   ├── layout/         # AppLayout, AppHeader, SearchBox
│       │   ├── boards/         # BoardTile, CreateBoardPopover
│       │   ├── board/          # BoardCanvas (DnD), ListColumn, CardItem, menus, filter
│       │   └── card/           # CardModal & sub-komponen (checklist, comments, …)
│       └── utils/              # theme, date, filters, storage
└── e2e/
    ├── playwright.config.js    # menjalankan stack terisolasi (port 4100/5180)
    └── tests/                  # *.spec.js + helpers.js
```

Prinsip: **layered architecture** di backend (route → controller → service → repository), **feature-based components** di frontend, konfigurasi via environment variable (12-factor).

## 4. Model Data (file JSON)

Satu file `backend/data/db.json` berisi koleksi berikut:

```jsonc
{
  "users":      [{ "id", "username", "name", "email", "initials", "avatarColor", "passwordHash", "createdAt" }],
  "workspaces": [{ "id", "name", "ownerId", "memberIds": [], "createdAt" }],
  "boards":     [{ "id", "title", "background", "workspaceId", "ownerId", "memberIds": [], "starredBy": [],
                   "labels": [{ "id", "name", "color" }], "createdAt", "updatedAt" }],
  "lists":      [{ "id", "boardId", "title", "position", "archived", "createdAt", "updatedAt" }],
  "cards":      [{ "id", "boardId", "listId", "title", "description", "position",
                   "labelIds": [], "memberIds": [], "startDate", "dueDate", "dueComplete", "cover",
                   "checklists": [{ "id", "title", "items": [{ "id", "text", "done" }] }],
                   "attachments": [{ "id", "name", "storedName", "mimeType", "size", "uploadedBy", "createdAt" }],
                   "archived", "createdBy", "createdAt", "updatedAt" }],
  "comments":   [{ "id", "cardId", "userId", "text", "edited?", "createdAt", "updatedAt" }],
  "activities": [{ "id", "boardId", "cardId|null", "userId", "message", "createdAt" }]
}
```

- Semua ID = UUID v4 (`crypto.randomUUID`).
- Relasi via ID; label disimpan di board, card menyimpan `labelIds`.
- `position` = integer 0..n-1 dalam satu list (atau dalam satu board untuk list); card/list terarsip dikeluarkan dari urutan.
- `passwordHash` (bcrypt cost 10) **tidak pernah** dikirim ke klien (`toPublicUser`).

### 4.1 Engine penyimpanan (`database/jsonDb.js`)

1. Saat start: jika file belum ada atau `RESET_DB=true` → buat dari `seed.js`; jika ada → baca ke memori.
2. Semua operasi baca/tulis dilakukan **di memori** (Node single-threaded → tidak ada race di dalam proses).
3. Setiap mutasi memanggil `persist()` → penulisan diserialisasi lewat promise chain dan **atomik**: tulis ke `db.json.<pid>.tmp` lalu `rename` (fallback tulis langsung bila Windows mengunci file).
4. `SIGINT/SIGTERM` menunggu antrean tulis selesai (`db.flush()`) sebelum keluar.

Batasan: hanya untuk **satu instance** proses. Untuk skala lebih besar, ganti implementasi `repositories/index.js` ke database (PostgreSQL/MongoDB) tanpa mengubah service.

## 5. Algoritma Urutan & Drag and Drop

**Frontend (`BoardCanvas.jsx`):**
1. `DragDropContext` dengan satu `Droppable` horizontal tipe `LIST` (board) dan satu `Droppable` vertikal tipe `CARD` per list.
2. `onBeforeCapture`: saat card mulai di-drag, list kosong diberi tinggi zona drop (`min-h-14`) **sebelum** library mengukur dimensi — diperlukan agar keyboard sensor dapat memindahkan card ke list kosong.
3. `onDragEnd` → mutation dengan **optimistic update**: cache board diubah langsung (`applyCardMove`/`applyListMove`), lalu `PATCH .../move`. Gagal → rollback + toast. Selesai → invalidate query board.
4. Jika filter aktif, indeks tujuan (relatif terhadap card yang terlihat) diterjemahkan ke indeks sebenarnya di list.

**Backend (`card.service.moveCard`):**
```
source = kartu aktif di list asal tanpa kartu yang dipindah → reindex 0..n-1
target = kartu aktif di list tujuan tanpa kartu yang dipindah
target.splice(clamp(index), 0, kartu) → reindex 0..n-1
jika pindah board: labelIds dikosongkan, memberIds disaring ke anggota board tujuan
```
Server adalah sumber kebenaran: indeks di-*clamp* dan urutan selalu dinormalisasi.

## 6. Spesifikasi API

Base URL: `/api`. Semua body JSON. Semua request non-GET wajib header `X-Requested-With: XMLHttpRequest`. Semua endpoint selain `/health` dan `/auth/login|logout` wajib cookie sesi.

Format error: `{ "error": { "message": "...", "details": [{ "field", "message" }]? } }`

| Status | Arti |
|--------|------|
| 400 | Validasi gagal / ID tidak valid / file ditolak |
| 401 | Belum login / sesi kedaluwarsa |
| 403 | Header anti-CSRF hilang / bukan pemilik (aksi khusus pemilik) |
| 404 | Tidak ditemukan **atau** bukan anggota board (mencegah enumerasi) |
| 409 | Konflik (mis. user sudah anggota) |
| 413 / 429 / 500 | Body terlalu besar / rate limit / error server |

### 6.1 Auth & umum

| Method | Path | Body / Query | Respons |
|--------|------|--------------|---------|
| GET | `/health` | — | `{ status, time }` |
| POST | `/auth/login` | `{ username, password }` | `200 { user }` + `Set-Cookie: kanban_token` |
| POST | `/auth/logout` | — | `204`, cookie dihapus |
| GET | `/auth/me` | — | `{ user }` |
| GET | `/users?q=` | q opsional | `{ users }` |
| GET | `/workspaces` | — | `{ workspaces }` |
| POST | `/workspaces` | `{ name }` | `201 { workspace }` |
| GET | `/search?q=` | q 1–100 | `{ boards, cards }` |

### 6.2 Board

| Method | Path | Body | Respons |
|--------|------|------|---------|
| GET | `/boards` | — | `{ boards: [summary + starred] }` |
| POST | `/boards` | `{ title, background?, workspaceId }` | `201 { board }` |
| GET | `/boards/:boardId` | — | `{ board (+members, starred), lists, cards (+badges) }` |
| PATCH | `/boards/:boardId` | `{ title?, background? }` | `{ board }` |
| DELETE | `/boards/:boardId` | — (pemilik) | `204` |
| POST | `/boards/:boardId/star` | — | `{ starred }` (toggle) |
| GET | `/boards/:boardId/archived` | — | `{ lists, cards }` |
| GET | `/boards/:boardId/activities` | — | `{ activities }` (100 terbaru) |
| POST | `/boards/:boardId/members` | `{ userId }` | `201 { members }` |
| DELETE | `/boards/:boardId/members/:userId` | — | `{ members }` |
| POST | `/boards/:boardId/labels` | `{ name?, color }` | `201 { label }` |
| PATCH | `/boards/:boardId/labels/:labelId` | `{ name?, color? }` | `{ label }` |
| DELETE | `/boards/:boardId/labels/:labelId` | — | `204` |
| POST | `/boards/:boardId/lists` | `{ title }` | `201 { list }` |

### 6.3 List

| Method | Path | Body | Respons |
|--------|------|------|---------|
| PATCH | `/lists/:listId` | `{ title?, archived? }` | `{ list }` |
| PATCH | `/lists/:listId/move` | `{ index }` | `{ lists }` (urutan baru) |
| DELETE | `/lists/:listId` | — (pemilik) | `204` |
| POST | `/lists/:listId/cards` | `{ title }` | `201 { card }` |

### 6.4 Card

| Method | Path | Body | Respons |
|--------|------|------|---------|
| GET | `/cards/:cardId` | — | `{ card (+members, comments, activities, listTitle) }` |
| PATCH | `/cards/:cardId` | `{ title?, description?, labelIds?, memberIds?, startDate?, dueDate?, dueComplete?, cover?, archived? }` | `{ card }` |
| PATCH | `/cards/:cardId/move` | `{ listId, index }` | `{ card }` |
| DELETE | `/cards/:cardId` | — | `204` |
| POST | `/cards/:cardId/checklists` | `{ title? }` | `201 { checklist }` |
| PATCH | `/cards/:cardId/checklists/:checklistId` | `{ title }` | `{ checklist }` |
| DELETE | `/cards/:cardId/checklists/:checklistId` | — | `204` |
| POST | `/cards/:cardId/checklists/:checklistId/items` | `{ text }` | `201 { item }` |
| PATCH | `/cards/:cardId/checklists/:checklistId/items/:itemId` | `{ text?, done? }` | `{ item }` |
| DELETE | `/cards/:cardId/checklists/:checklistId/items/:itemId` | — | `204` |
| POST | `/cards/:cardId/comments` | `{ text }` | `201 { comment }` |
| PATCH | `/comments/:commentId` | `{ text }` (penulis) | `{ comment }` |
| DELETE | `/comments/:commentId` | — (penulis) | `204` |
| POST | `/cards/:cardId/attachments` | `multipart/form-data`, field `file` | `201 { attachment }` |
| GET | `/cards/:cardId/attachments/:attachmentId[?inline=1]` | — | file (attachment; inline hanya untuk gambar raster) |
| DELETE | `/cards/:cardId/attachments/:attachmentId` | — | `204` |

Contoh:
```bash
curl -c jar -H "X-Requested-With: XMLHttpRequest" -H "Content-Type: application/json" \
     -d '{"username":"alice","password":"password123"}' http://localhost:4000/api/auth/login
curl -b jar http://localhost:4000/api/boards
```

## 7. Frontend — Desain Teknis

- **State server** sepenuhnya di TanStack Query (`hooks/queries.js`). Query key: `['boards']`, `['board', id]`, `['card', id]`, `['archived', id]`, `['activities', id]`, `['users', q]`, `['workspaces']`.
- `useBoardMutation(boardId, fn, { cardId, optimistic, extraKeys })` — pola mutasi standar: toast saat error, rollback optimistic, invalidate board/card setelahnya.
- **Auth:** `AuthContext` memanggil `/auth/me` saat start; event global `flowboard:unauthorized` (dipancarkan `api/client.js` saat 401) mengosongkan sesi & cache.
- **Routing guard:** `ProtectedRoute` / `PublicOnlyRoute`; redirect pasca-login hanya ke path internal (`/…`, bukan `//…`).
- **Popover** dirender via portal dengan posisi `fixed` dari elemen anchor (tidak terpotong oleh list yang scroll atau modal); Esc ditangkap di fase capture agar tidak ikut menutup modal.
- **Styling:** Tailwind v4 (`@import 'tailwindcss'`, token di `@theme`, utilitas kustom via `@utility`). Warna dari API dipetakan ke class literal di `utils/theme.js` agar ter-scan Tailwind.

## 8. Konfigurasi (backend/.env)

| Variabel | Default | Keterangan |
|----------|---------|------------|
| `NODE_ENV` | development | `production` mengaktifkan cookie `Secure` & menyajikan frontend |
| `PORT` | 4000 | |
| `CORS_ORIGIN` | http://localhost:5173 | daftar dipisah koma |
| `JWT_SECRET` | (dev fallback) | **wajib** ≥ 32 karakter di production (server menolak start) |
| `JWT_EXPIRES_IN` | 8h | |
| `DB_FILE` | data/db.json | relatif terhadap `backend/` |
| `UPLOAD_DIR` | uploads | |
| `MAX_UPLOAD_MB` | 10 | |
| `RESET_DB` | false | `true` = seed ulang setiap start |
| `LOGIN_RATE_LIMIT` | 20 | percobaan gagal / 15 menit / IP |

## 9. Build, Run & Test

```bash
npm install                 # di root kanban-app (semua workspace)
npm run dev                 # API :4000 + Web :5173
npm run seed                # reset data ke seed
npm test                    # API integration tests (node:test)
npm run lint                # ESLint frontend
npx playwright install chromium   # sekali saja
npm run test:e2e            # Playwright E2E (stack terisolasi :4100/:5180)
npm start                   # build frontend + jalankan server production
```

## 10. Logging & Error Handling

- `morgan` (dev: ringkas, prod: combined). Dimatikan saat `NODE_ENV=test`.
- Error tak terduga → log lengkap di server, klien hanya menerima `Internal server error` (detail `debug` hanya di non-production).
- Express 5 meneruskan error dari handler async secara otomatis ke `errorHandler`.

## 11. Keterbatasan yang Diketahui

| Item | Penjelasan | Rencana |
|------|------------|---------|
| Single instance | File JSON tidak aman untuk banyak proses/server | Ganti repository ke DB |
| Tanpa real-time | Perubahan pengguna lain terlihat setelah refetch (fokus tab/aksi) | WebSocket/SSE |
| Last-write-wins | Edit bersamaan di field yang sama saling menimpa | Versioning / optimistic locking |
| Nested scroll DnD | `@hello-pangea/dnd` memberi peringatan dev "nested scroll container" (list scroll di dalam board scroll). Drag tetap berfungsi; auto-scroll horizontal board saat menyeret card ke list di luar layar terbatas | Evaluasi `@dnd-kit` bila diperlukan |
| Bundle > 500 KB | Satu chunk JS (~160 KB gzip) | Code-splitting per route |
