# Functional Specification Document (FSD)

**Produk:** FlowBoard — Aplikasi Kanban Tim
**Versi:** 1.0 · **Tanggal:** 2 November 2026
**Referensi:** [BRD.md](BRD.md)

---

## 1. Ringkasan

Dokumen ini menjelaskan **perilaku fungsional** aplikasi: layar, alur pengguna, aturan bisnis, dan validasi. Setiap kebutuhan fungsional (FR) dipetakan ke kebutuhan bisnis (BR) dan test case E2E (TC).

## 2. Peran & Hak Akses

| Aksi | Pemilik board | Anggota board | Bukan anggota |
|------|:---:|:---:|:---:|
| Melihat board, list, card | ✅ | ✅ | ❌ (404 "Board not found") |
| Membuat/mengedit/memindah list & card | ✅ | ✅ | ❌ |
| Komentar, checklist, lampiran, label | ✅ | ✅ | ❌ |
| Edit/hapus komentar | Hanya komentar sendiri | Hanya komentar sendiri | ❌ |
| Mengundang anggota | ✅ | ✅ | ❌ |
| Menghapus anggota lain | ✅ | ❌ | ❌ |
| Keluar dari board (leave) | ❌ (pemilik tidak bisa keluar) | ✅ | ❌ |
| Menghapus list secara permanen | ✅ | ❌ (hanya arsip) | ❌ |
| Menghapus board | ✅ | ❌ | ❌ |

## 3. Peta Layar

```
/login                 Halaman login (publik)
/                      Beranda: Starred, Recently viewed, Workspaces & board
/b/:boardId            Board (list & card, drag & drop)
/b/:boardId?card=:id   Board + modal detail card (URL bisa dibagikan)
*                      404
```

Header global (semua halaman terautentikasi): Logo → Beranda, dropdown **Recent**, dropdown **Starred**, tombol **Create** (board), kotak **Search**, menu akun (profil & **Log out**).

## 4. Kebutuhan Fungsional

### 4.1 Autentikasi (BR-01)

| ID | Spesifikasi | TC |
|----|-------------|----|
| FR-AUTH-01 | Pengguna yang belum login diarahkan ke `/login`; setelah login dikembalikan ke halaman yang dituju sebelumnya | TC-AUTH-01 |
| FR-AUTH-02 | Form login: `username` & `password` wajib. Kredensial salah menampilkan pesan generik **"Invalid username or password"** (tidak membedakan username salah vs password salah) | TC-AUTH-02 |
| FR-AUTH-03 | Akun dummy: `alice`, `bob`, `charlie`, `diana`, `evan` — password `password123`. Tombol avatar demo mengisi form otomatis | TC-AUTH-03, TC-AUTH-04 |
| FR-AUTH-04 | Sesi bertahan saat reload (cookie httpOnly, masa berlaku 8 jam). Logout menghapus sesi | TC-AUTH-05, TC-AUTH-06 |
| FR-AUTH-05 | Maksimal 20 percobaan login gagal per IP per 15 menit (dapat dikonfigurasi) | Unit/API |

### 4.2 Workspace & Board (BR-02, BR-10)

| ID | Spesifikasi | TC |
|----|-------------|----|
| FR-BOARD-01 | Buat board: judul (1–100 karakter, wajib), background (8 pilihan gradien), workspace. Setelah dibuat, langsung membuka board | TC-BOARD-01 |
| FR-BOARD-02 | Judul board diubah inline (klik judul → Enter/blur menyimpan, Esc membatalkan) | TC-BOARD-02 |
| FR-BOARD-03 | Star/unstar board dari header board, tile beranda, atau dropdown. Board berbintang tampil di bagian "Starred boards" | TC-BOARD-03 |
| FR-BOARD-04 | "Recently viewed" menyimpan 6 board terakhir dibuka (per pengguna, di browser) | — |
| FR-BOARD-05 | Menu board (⋯): Activity, Archived items, Change background, Labels, Delete board (pemilik) | TC-BOARD-05 |
| FR-BOARD-06 | Hapus board meminta konfirmasi dan menghapus seluruh list, card, komentar, aktivitas, dan file lampiran | TC-BOARD-05 |
| FR-BOARD-07 | Buat workspace baru (nama 1–80 karakter) dari beranda | — |
| FR-BOARD-08 | Board baru mendapat 6 label default (hijau, kuning, oranye, merah, ungu, biru) | — |

### 4.3 List (BR-03)

| ID | Spesifikasi | TC |
|----|-------------|----|
| FR-LIST-01 | Tambah list via "Add another list" (judul 1–100 karakter). Tombol "Add list" nonaktif untuk judul kosong/spasi | TC-LIST-01, TC-BOARD-04 |
| FR-LIST-02 | Ubah judul list inline | TC-LIST-01 |
| FR-LIST-03 | **Drag & drop list** secara horizontal untuk mengubah urutan; urutan tersimpan | TC-DND-04 |
| FR-LIST-04 | Menu list: Add card, Archive this list, Delete list (pemilik, dengan konfirmasi) | TC-LIST-01 |
| FR-LIST-05 | List yang diarsipkan hilang dari board dan dapat di-restore dari *Archived items → Lists* (kembali di posisi paling kanan) | TC-LIST-01 |

### 4.4 Card (BR-04)

| ID | Spesifikasi | TC |
|----|-------------|----|
| FR-CARD-01 | Tambah card via "Add a card" di bawah list (judul 1–500 karakter). Enter menyimpan dan composer tetap terbuka untuk card berikutnya; Esc menutup | TC-CARD-01 |
| FR-CARD-02 | **Drag & drop card** ke posisi lain di list yang sama atau ke list lain (termasuk list kosong). Posisi tersimpan di server | TC-DND-01, TC-DND-02 |
| FR-CARD-03 | Drag & drop juga bisa dengan keyboard: fokus card → Space (angkat) → panah → Space (taruh); Esc membatalkan | TC-DND-03 |
| FR-CARD-04 | Drop di luar list membatalkan perpindahan | TC-DND-05 |
| FR-CARD-05 | Tampilan card di board menampilkan: cover, label, judul, badge due date (warna status), ikon deskripsi, jumlah komentar, jumlah lampiran, progres checklist (hijau jika 100%), avatar member | TC-CARD-03, TC-CARD-04 |
| FR-CARD-06 | Klik card membuka modal detail; URL berubah menjadi `?card=<id>` sehingga bisa dibagikan | TC-CARD-11 |

### 4.5 Detail Card (BR-05)

| ID | Spesifikasi | TC |
|----|-------------|----|
| FR-DET-01 | Judul diedit inline; nama list ditampilkan ("in list X") | TC-CARD-02 |
| FR-DET-02 | Deskripsi multi-baris (maks 10.000 karakter), Save/Cancel | TC-CARD-02 |
| FR-DET-03 | **Members:** pilih dari anggota board; tombol "Join" untuk menambahkan diri sendiri | TC-CARD-03 |
| FR-DET-04 | **Labels:** centang label board; buat label baru (nama opsional maks 50 karakter, 10 warna); edit/hapus label dari menu board | TC-CARD-03 |
| FR-DET-05 | **Dates:** start date & due date (tanggal+jam). Status due: *Complete* (hijau, jika dicentang selesai), *Overdue* (merah), *Due soon* (< 24 jam, kuning) | TC-CARD-06 |
| FR-DET-06 | **Checklist:** banyak checklist per card; tambah/edit/hapus item; centang item; progress bar %; sembunyikan item yang sudah dicentang | TC-CARD-04 |
| FR-DET-07 | **Attachment:** unggah 1 file per aksi, maks 10 MB, tipe yang diizinkan: PNG, JPEG, GIF, WEBP, PDF, TXT, CSV, ZIP, DOC(X), XLS(X), PPT(X). Gambar tampil sebagai thumbnail. Tipe lain ditolak dengan pesan error | TC-CARD-07, TC-CARD-08 |
| FR-DET-08 | **Cover:** pilih warna cover atau hapus | — |
| FR-DET-09 | **Comments:** tambah, edit (tanda "(edited)"), hapus komentar sendiri. Teks ditampilkan apa adanya (tidak dirender sebagai HTML) | TC-CARD-05 |
| FR-DET-10 | **Activity:** "Show details" menampilkan riwayat aktivitas card (dibuat, dipindah, dikomentari, dll.) | TC-ACT-01 |
| FR-DET-11 | **Move:** pindahkan card ke list & posisi tertentu lewat dialog | TC-CARD-09 |
| FR-DET-12 | **Archive → Send to board / Delete:** card diarsipkan dulu; hapus permanen hanya dari card terarsip dan memerlukan konfirmasi | TC-CARD-10 |

### 4.6 Kolaborasi (BR-06, BR-09)

| ID | Spesifikasi | TC |
|----|-------------|----|
| FR-COL-01 | Tombol **Share**: cari pengguna (nama/username) dan tambahkan sebagai anggota board | TC-COLLAB-01 |
| FR-COL-02 | Daftar anggota menampilkan pemilik (ikon mahkota). Pemilik dapat menghapus anggota; anggota dapat "Leave" | TC-COLLAB-02 |
| FR-COL-03 | Saat anggota dihapus/keluar, ia juga dilepas dari semua card board tersebut | API test |
| FR-COL-04 | Activity board mencatat aksi penting (maks 500 entri terakhir per board) | TC-ACT-01 |

### 4.7 Pencarian & Filter (BR-08)

| ID | Spesifikasi | TC |
|----|-------------|----|
| FR-SRC-01 | Search global (header) mencari judul/deskripsi card dan judul board pada board yang bisa diakses pengguna; maks 20 hasil per jenis; debounce 200 ms | TC-SEARCH-01 |
| FR-SRC-02 | Memilih hasil card membuka board dan modal card tersebut | TC-SEARCH-01 |
| FR-FLT-01 | Filter board: keyword, member, label, status due date (No dates/Overdue/Due soon/Complete). Kombinasi antar kategori = AND, di dalam kategori = OR | TC-FILTER-01 |
| FR-FLT-02 | Tombol Filters menampilkan jumlah filter aktif; tiap list menampilkan "x of y cards"; "Clear all filters" | TC-FILTER-01 |
| FR-FLT-03 | Drag & drop tetap berfungsi saat filter aktif; posisi dihitung relatif terhadap card yang terlihat | — |

## 5. Aturan Validasi (ringkas)

| Field | Aturan |
|-------|--------|
| Judul board / list | wajib, trim, 1–100 karakter |
| Judul card | wajib, trim, 1–500 karakter |
| Deskripsi card | maks 10.000 karakter |
| Komentar | wajib, 1–5.000 karakter |
| Item checklist | wajib, 1–500 karakter |
| Nama label | opsional, maks 50 karakter; warna dari daftar tetap |
| Tanggal | ISO 8601 dengan offset atau `null` |
| ID | UUID valid; ID tidak valid → 400 |
| Lampiran | maks 10 MB, MIME type dari allowlist |

Pesan error validasi dari server ditampilkan sebagai toast merah di kanan bawah.

## 6. Perilaku Non-fungsional yang Terlihat Pengguna

- **Optimistic UI:** drag & drop, star, centang checklist/label/due date langsung terlihat; jika server gagal, perubahan dikembalikan dan muncul toast error.
- Data di-refresh otomatis saat tab browser kembali fokus.
- Responsif: header & board dapat dipakai di layar laptop dan tablet; board scroll horizontal.
- Aksesibilitas: semua tombol ikon punya label; drag & drop via keyboard; modal & popover ditutup dengan Esc.
