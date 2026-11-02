# E2E Test Plan & Test Cases

**Produk:** FlowBoard — Aplikasi Kanban Tim
**Versi:** 1.0 · **Tanggal:** 2 November 2026
**Tool:** Playwright (`@playwright/test`) · Chromium
**Referensi:** [FSD.md](FSD.md) · [SECURITY.md](SECURITY.md)

---

## 1. Tujuan & Cakupan

Memverifikasi alur pengguna utama dari ujung ke ujung (browser → frontend → API → file JSON) sesuai FSD, terutama:

- Login dummy & proteksi halaman
- CRUD board, list, card
- **Drag & drop** (mouse dan keyboard) termasuk persistensi setelah reload
- Detail card: label, member, tanggal, checklist, komentar, lampiran, move, archive/delete
- Kolaborasi & kontrol akses antar pengguna
- Pencarian, filter, activity log
- Kontrol keamanan yang terlihat dari browser (cookie httpOnly, upload ditolak, XSS)

Di luar cakupan E2E: performa/beban, kompatibilitas lintas browser selain Chromium, uji visual pixel-perfect.

## 2. Lingkungan Uji

`e2e/playwright.config.js` menjalankan **stack terisolasi** secara otomatis — tidak menyentuh data development:

| Komponen | Nilai |
|----------|-------|
| API | `http://localhost:4100`, `NODE_ENV=test` |
| Web (Vite) | `http://localhost:5180`, proxy `/api` → 4100 |
| Data | `backend/data/db.e2e.json`, **di-reset dari seed setiap run** (`RESET_DB=true`) |
| Upload | `backend/uploads-e2e/` |
| Rate limit login | 1000 (agar login berulang di test tidak terblokir) |
| Browser | Desktop Chrome, viewport 1440×900 |
| Eksekusi | serial (`workers: 1`) karena berbagi satu file JSON |
| Artefak gagal | screenshot, video, trace (`e2e/test-results/`), laporan HTML (`e2e/playwright-report/`) |

Setiap test membuat board sendiri dengan nama unik (`seedBoard`) sehingga test independen satu sama lain.

## 3. Cara Menjalankan

```bash
# sekali saja
npm install
npx playwright install chromium

# jalankan semua E2E (dari root kanban-app)
npm run test:e2e

# mode UI interaktif / headed / satu test
npm run test:ui -w e2e
npm run test:headed -w e2e
npx playwright test -g "TC-DND-01" --config e2e/playwright.config.js

# buka laporan HTML terakhir
npm run report -w e2e
```

## 4. Strategi Teknis

- **Locator berbasis aksesibilitas** (`getByRole`, `getByLabel`) — sekaligus memastikan UI punya label yang benar. `data-testid` hanya untuk elemen tanpa peran semantik (card, list, badge progres).
- **Drag & drop mouse** (`helpers.dragAndDrop`): mouse down → gerak kecil melewati ambang "sloppy click" → gerak bertahap 25 langkah ke target → mouse up, lalu **menunggu respons `PATCH …/move`** sebelum memeriksa persistensi.
- **Drag & drop keyboard** (`helpers.keyboardDrag`): fokus handle → Space → panah (jeda 400 ms per langkah untuk animasi) → Space.
- Checkbox terkontrol diuji dengan `click()` + `expect(...).toBeChecked()` (auto-retry), karena state diperbarui via cache query.
- Multi-user: `browser.newContext()` terpisah untuk tiap pengguna (cookie terisolasi).

## 5. Test Cases

Legenda prioritas: **P1** = kritikal (blokir rilis), **P2** = penting, **P3** = tambahan.

### 5.1 Autentikasi — `tests/auth.spec.js`

| ID | Skenario | Langkah | Hasil yang diharapkan | Prio | FR |
|----|----------|---------|------------------------|------|----|
| TC-AUTH-01 | Redirect bila belum login | Buka `/` | Diarahkan ke `/login`, tombol "Log in" tampil | P1 | FR-AUTH-01 |
| TC-AUTH-02 | Kredensial salah | Isi `alice` / password salah → Log in | Alert "Invalid username or password", tetap di `/login` | P1 | FR-AUTH-02 |
| TC-AUTH-03 | Login sukses | Login `alice` / `password123` | Heading "Hi Alice 👋", board "Program Management" tampil | P1 | FR-AUTH-03 |
| TC-AUTH-04 | Shortcut akun demo | Klik avatar demo "bob" | Field username = `bob`, password terisi | P3 | FR-AUTH-03 |
| TC-AUTH-05 | Sesi & logout | Login → reload → Account menu → Log out → buka `/` | Tetap login setelah reload; setelah logout diarahkan ke `/login` | P1 | FR-AUTH-04 |
| TC-AUTH-06 | Cookie aman | Login, baca cookies & `document.cookie` | Cookie `kanban_token` httpOnly, SameSite=Strict, tidak terbaca JS | P1 | SEC 3.1 |

### 5.2 Board & List — `tests/board.spec.js`

| ID | Skenario | Langkah | Hasil yang diharapkan | Prio | FR |
|----|----------|---------|------------------------|------|----|
| TC-BOARD-01 | Buat board | Create → isi judul → Create → Home | URL `/b/<uuid>`; board muncul di beranda | P1 | FR-BOARD-01 |
| TC-BOARD-02 | Rename board | Klik judul → ketik → Enter → reload | Judul baru tampil & bertahan setelah reload | P2 | FR-BOARD-02 |
| TC-BOARD-03 | Star board | Klik bintang → Home | Bagian "Starred boards" berisi board tsb | P2 | FR-BOARD-03 |
| TC-LIST-01 | Tambah, rename, arsip, restore list | Tambah 2 list → rename → Archive → Menu → Archived items → Lists → Restore | List ter-rename; hilang saat diarsip; kembali setelah restore | P1 | FR-LIST-01/02/04/05 |
| TC-CARD-01 | Tambah card & persist | Tambah 2 card → reload | Urutan card sama setelah reload | P1 | FR-CARD-01 |
| TC-BOARD-04 | Validasi judul list kosong | Isi judul spasi saja | Tombol "Add list" nonaktif | P2 | FR-LIST-01 |
| TC-BOARD-05 | Hapus board (pemilik) | Menu → Delete board → konfirmasi | Kembali ke beranda; board hilang | P2 | FR-BOARD-06 |

### 5.3 Drag & Drop — `tests/dnd.spec.js`

Pra-kondisi: board baru dengan list *To Do, Doing, Done*; card *A, B, C* di *To Do*.

| ID | Skenario | Langkah | Hasil yang diharapkan | Prio | FR |
|----|----------|---------|------------------------|------|----|
| TC-DND-01 | Pindah card antar list (mouse) | Drag *Card A* ke *Doing* → reload | *Doing* = [A]; *To Do* = [B, C]; bertahan setelah reload | P1 | FR-CARD-02 |
| TC-DND-02 | Urutkan card dalam list | Drag *Card C* ke atas *Card A* → reload | *To Do* = [C, A, B] dan bertahan | P1 | FR-CARD-02 |
| TC-DND-03 | Pindah card via keyboard (melewati list kosong) | Fokus *Card B* → Space → → → → Space → reload | *Done* = [B] dan bertahan | P2 | FR-CARD-03 |
| TC-DND-04 | Urutkan list | Fokus header *Done* → Space → ← ← → Space → reload | Urutan list = [Done, To Do, Doing] dan bertahan | P1 | FR-LIST-03 |
| TC-DND-05 | Drop di luar list | Drag *Card A* ke area kosong | Urutan tidak berubah | P2 | FR-CARD-04 |

### 5.4 Detail Card — `tests/card.spec.js`

Pra-kondisi: board baru dengan list *To Do, Done* dan card *Detail card*.

| ID | Skenario | Langkah | Hasil yang diharapkan | Prio | FR |
|----|----------|---------|------------------------|------|----|
| TC-CARD-02 | Edit judul & deskripsi | Buka card → ubah judul → isi deskripsi 2 baris → Save | Judul & deskripsi (multi-baris) tersimpan; board menampilkan judul baru | P1 | FR-DET-01/02 |
| TC-CARD-03 | Label & member | Labels → centang hijau; Join | Label tampil di modal & card; avatar Alice di card | P1 | FR-DET-03/04 |
| TC-CARD-04 | Checklist | Checklist → Add → tambah 2 item → centang satu-satu | Progres 50% → 100%; badge card "2/2" | P1 | FR-DET-06 |
| TC-CARD-05 | Komentar | Tulis `<b>not html</b> looks good` → Save → Edit → Delete | Teks tampil literal (bukan HTML); "(edited)" muncul; komentar terhapus | P1 | FR-DET-09, SEC 3.5 |
| TC-CARD-06 | Due date | Dates → due 2020-01-15 → Save → centang selesai | Status "Overdue" → "Complete" | P2 | FR-DET-05 |
| TC-CARD-07 | Lampiran | Attachment → unggah .txt → unduh via link → Delete | File tampil; unduhan 200 dengan isi sama; terhapus | P1 | FR-DET-07 |
| TC-CARD-08 | Tolak tipe file | Unggah file `.html` | Toast "... is not allowed"; tidak ada lampiran | P1 | FR-DET-07, SEC 3.6 |
| TC-CARD-09 | Move via dialog | Move → pilih list *Done* → Move | Modal "in list Done"; card ada di *Done* | P2 | FR-DET-11 |
| TC-CARD-10 | Archive, restore, delete | Archive → Send to board → Close → buka lagi → Archive → Delete → Confirm | Banner arsip muncul/hilang; card akhirnya terhapus | P1 | FR-DET-12 |
| TC-CARD-11 | Deep link card | Buka card → salin URL → buka URL | Modal card langsung terbuka | P3 | FR-CARD-06 |

### 5.5 Kolaborasi, Pencarian, Filter — `tests/collaboration.spec.js`

| ID | Skenario | Langkah | Hasil yang diharapkan | Prio | FR |
|----|----------|---------|------------------------|------|----|
| TC-COLLAB-01 | Kontrol akses & invite | Alice buat board; Evan buka URL → "Board not found"; Alice Share → Add Evan; Evan buka lagi | Evan ditolak sebelum diundang, bisa melihat board & card setelahnya | P1 | FR-COL-01, SEC 3.2 |
| TC-COLLAB-02 | Hak anggota vs pemilik | Alice undang Bob; Bob buka menu (tidak ada "Delete board"); Bob Leave | Bob tidak bisa hapus board; setelah leave diarahkan ke beranda & board 404 | P1 | FR-COL-02 |
| TC-SEARCH-01 | Pencarian global | Buat card unik → Home → ketik di Search → klik hasil | Modal card terbuka | P2 | FR-SRC-01/02 |
| TC-FILTER-01 | Filter | Label hijau di "Beta task"; filter keyword "task"; lalu filter label hijau; Clear | 2 card ("2 of 3 cards") → 1 card, badge filter "1" → 3 card | P2 | FR-FLT-01/02 |
| TC-ACT-01 | Activity log | Pindah card via Move → Show details | Feed berisi "moved this card from To Do to Done" | P3 | FR-DET-10 |

**Total: 33 test case E2E** (6 auth, 7 board/list, 5 drag & drop, 10 detail card, 5 kolaborasi/pencarian/filter/activity). Ditambah **7 test integrasi API** di `backend/tests/api.test.js`.

## 6. Matriks Ketertelusuran (BR → TC)

| BR | Test case |
|----|-----------|
| BR-01 Login | TC-AUTH-01…06 |
| BR-02 Board | TC-BOARD-01, 02, 05 |
| BR-03 List | TC-LIST-01, TC-BOARD-04, TC-DND-04 |
| BR-04 Card & DnD | TC-CARD-01, TC-DND-01…05, TC-CARD-09, 10 |
| BR-05 Detail card | TC-CARD-02…08 |
| BR-06 Akses & berbagi | TC-COLLAB-01, 02 |
| BR-07 Persistensi | Semua TC dengan langkah *reload* (CARD-01, DND-01…04, BOARD-02) |
| BR-08 Cari & filter | TC-SEARCH-01, TC-FILTER-01 |
| BR-09 Activity | TC-ACT-01 |
| BR-10 Star/recent | TC-BOARD-03 |
| BR-12 Keyboard | TC-DND-03, TC-DND-04 |

## 7. Kriteria Lulus

- 100% test **P1** lulus; ≥ 95% total test lulus tanpa retry di lokal.
- Tidak ada error console aplikasi (selain peringatan dev-only dari `@hello-pangea/dnd`, lihat TSD §11).
- Test API backend (`npm test`) lulus.

## 8. Hasil Eksekusi Terakhir

| Tanggal | Lingkungan | Hasil |
|---------|------------|-------|
| 2 Nov 2026 | Windows 11, Node 24.13, Chromium (Playwright 1.64) | **33/33 lulus** (±93 detik), API test 7/7 lulus, lint bersih |

## 9. Integrasi CI (contoh GitHub Actions)

```yaml
name: test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 24, cache: npm }
      - run: npm ci
      - run: npm test
      - run: npm run lint
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e
        env: { CI: 'true' }
      - uses: actions/upload-artifact@v4
        if: failure()
        with: { name: playwright-report, path: e2e/playwright-report }
```
