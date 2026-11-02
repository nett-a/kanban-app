# FlowBoard — Team Kanban (Trello-like)

Aplikasi papan Kanban untuk tim: **board → list → card** dengan **drag & drop**, detail card lengkap (label, member, due date, checklist, komentar, lampiran, cover), kolaborasi, pencarian, filter, dan activity log. Login memakai **akun dummy**, data disimpan permanen di **file JSON**.

| Lapisan | Stack |
|---------|-------|
| Backend | Node.js 24 · Express 5 · Zod · JWT (cookie httpOnly) · Multer |
| Frontend | React 19 · Vite 8 · Tailwind CSS 4 · React Router 8 · TanStack Query 5 · @hello-pangea/dnd |
| Storage | `backend/data/db.json` (+ `backend/uploads/` untuk lampiran) |
| Testing | node:test + supertest (API) · Playwright (E2E) |

## Quick start

Prasyarat: **Node.js ≥ 22.12** (disarankan 24).

```bash
cd kanban-app
npm install
npm run dev
```

- Web: http://localhost:5173
- API: http://localhost:4000/api/health

Data awal dibuat otomatis saat pertama kali jalan (board contoh **"Program Management"**).

### Akun dummy

Semua password: `password123`

| Username | Nama | Catatan |
|----------|------|---------|
| `alice` | Alice Johnson | Pemilik board contoh |
| `bob` | Bob Smith | Anggota board contoh |
| `charlie` | Charlie Davis | Anggota board contoh |
| `diana` | Diana Prince | Anggota board contoh |
| `evan` | Evan Wright | Bukan anggota — untuk uji kontrol akses |

## Scripts (dari root `kanban-app/`)

| Perintah | Fungsi |
|----------|--------|
| `npm run dev` | Jalankan API + web (hot reload) |
| `npm run seed` | Reset data ke kondisi awal |
| `npm test` | Test integrasi API |
| `npm run lint` | ESLint frontend |
| `npm run test:e2e` | Test E2E Playwright (jalankan `npx playwright install chromium` sekali) |
| `npm run build` | Build frontend ke `frontend/dist` |
| `npm start` | Build + jalankan mode production (satu port, default 4000) |

Konfigurasi backend: salin `backend/.env.example` → `backend/.env`. Untuk production **wajib** set `NODE_ENV=production` dan `JWT_SECRET` (≥ 32 karakter).

## Fitur

- **Board:** buat, rename, 8 background, star, recent, hapus (pemilik), workspace.
- **List:** tambah, rename, drag & drop urutan, arsip/restore, hapus (pemilik).
- **Card:** tambah cepat, drag & drop antar list & posisi (mouse **dan keyboard**), modal detail dengan URL yang bisa dibagikan.
- **Detail card:** deskripsi, label (CRUD label board), member/join, start & due date + status, checklist dengan progres, komentar (edit/hapus), lampiran (preview gambar), cover, move, arsip → hapus, activity.
- **Kolaborasi:** share board ke pengguna, remove/leave, hak pemilik vs anggota.
- **Cari & filter:** pencarian global card/board; filter keyword, member, label, due date.

## Struktur folder

```
kanban-app/
├── backend/        Express API (routes → controllers → services → repositories → JSON DB)
├── frontend/       React SPA (pages, components, hooks, api, context)
├── e2e/            Playwright tests
└── docs/           BRD, FSD, TSD, SECURITY, E2E-TESTING
```

Detail lengkap ada di [docs/TSD.md](docs/TSD.md).

## Dokumentasi

| Dokumen | Isi |
|---------|-----|
| [BRD](docs/BRD.md) | Tujuan bisnis, ruang lingkup, kebutuhan bisnis, risiko |
| [FSD](docs/FSD.md) | Spesifikasi fungsional, hak akses, layar, aturan validasi |
| [TSD](docs/TSD.md) | Arsitektur, struktur folder, model data, API, algoritma DnD |
| [SECURITY](docs/SECURITY.md) | Kontrol keamanan, OWASP Top 10, checklist production |
| [E2E-TESTING](docs/E2E-TESTING.md) | Strategi, lingkungan, 33 test case, traceability |
