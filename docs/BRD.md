# Business Requirements Document (BRD)

**Produk:** FlowBoard — Aplikasi Kanban Tim (mirip Trello)
**Versi dokumen:** 1.0 · **Tanggal:** 2 November 2026
**Status:** Draft untuk review

---

## 1. Latar Belakang

Tim saat ini mengelola pekerjaan lewat chat, spreadsheet, dan catatan terpisah. Akibatnya status pekerjaan sulit dilacak, prioritas tidak terlihat, dan tidak ada satu sumber kebenaran untuk "siapa mengerjakan apa, kapan selesai".

FlowBoard adalah aplikasi papan Kanban internal yang meniru alur kerja Trello: **board → list (kolom) → card (tugas)**, dengan drag & drop untuk memindahkan pekerjaan antar tahap.

## 2. Tujuan Bisnis

| ID | Tujuan | Indikator keberhasilan |
|----|--------|------------------------|
| BO-01 | Visibilitas status pekerjaan tim dalam satu tempat | 100% pekerjaan aktif tim tercatat sebagai card |
| BO-02 | Mempercepat koordinasi (siapa, apa, kapan) | Setiap card punya penanggung jawab & due date bila relevan |
| BO-03 | Mengurangi ketergantungan pada tools berbayar | Fitur inti Trello tersedia tanpa lisensi pihak ketiga |
| BO-04 | Mudah dipakai tanpa pelatihan | Pengguna baru bisa membuat board & card < 2 menit |

## 3. Ruang Lingkup

### 3.1 Dalam lingkup (Phase 1 — rilis ini)

- Login dengan **akun dummy** (tanpa registrasi/SSO).
- Workspace, board, list, card.
- **Drag & drop** card antar list dan antar posisi, serta drag & drop list.
- Detail card: deskripsi, label, member, start/due date, checklist, komentar, lampiran file, cover, activity log.
- Star board, recent board, pencarian global, filter card.
- Berbagi board ke anggota tim (invite / remove / leave).
- Arsip & restore list/card, hapus permanen.
- Penyimpanan data permanen di **file JSON** (tanpa database server).

### 3.2 Di luar lingkup (kandidat Phase 2)

- Registrasi akun, reset password, SSO (Google/Microsoft), 2FA.
- Real-time sync multi-user (WebSocket); saat ini data diperbarui saat refresh / fokus ulang tab.
- Notifikasi email/push, mention `@user`.
- Power-Ups, automation (Butler), custom fields, tampilan Calendar/Timeline/Table.
- Aplikasi mobile native.
- Database relasional & skala multi-server.

## 4. Stakeholder

| Peran | Kepentingan |
|-------|-------------|
| Product Owner | Menentukan prioritas fitur & menerima hasil |
| Anggota tim (end user) | Mengelola tugas harian di board |
| Team Lead | Memantau progres, menugaskan anggota |
| Engineering | Membangun & memelihara aplikasi |
| Security / IT | Memastikan data internal aman |

## 5. Persona Pengguna

- **Alice — Team Lead.** Membuat board per program, mengundang anggota, memantau kartu overdue.
- **Bob — Engineer.** Memindahkan card dari *To Do* ke *Done*, mencentang checklist, melampirkan dokumen.
- **Evan — Kolaborator lintas tim.** Hanya bisa melihat board yang dibagikan kepadanya.

## 6. Kebutuhan Bisnis (Business Requirements)

| ID | Kebutuhan | Prioritas |
|----|-----------|-----------|
| BR-01 | Pengguna harus login sebelum mengakses data; akun dummy disediakan untuk tim | Must |
| BR-02 | Pengguna dapat membuat dan mengelola board di dalam workspace | Must |
| BR-03 | Board terdiri dari list yang bisa ditambah, diubah nama, diurutkan, dan diarsipkan | Must |
| BR-04 | List berisi card yang bisa dibuat, diedit, dipindah (drag & drop), diarsipkan, dan dihapus | Must |
| BR-05 | Card mendukung deskripsi, label berwarna, member, tanggal, checklist, komentar, dan lampiran | Must |
| BR-06 | Board hanya dapat diakses oleh anggotanya; pemilik dapat mengundang/menghapus anggota | Must |
| BR-07 | Semua perubahan tersimpan permanen dan tetap ada setelah aplikasi direstart | Must |
| BR-08 | Pengguna dapat mencari card/board dan memfilter card di board | Should |
| BR-09 | Riwayat aktivitas (siapa melakukan apa) tercatat per board & card | Should |
| BR-10 | Board dapat ditandai bintang dan board terakhir dibuka mudah diakses | Should |
| BR-11 | Tampilan dan interaksi menyerupai Trello agar tim tidak perlu belajar ulang | Should |
| BR-12 | Aplikasi dapat dioperasikan dengan keyboard (aksesibilitas) | Could |

## 7. Asumsi & Batasan

- Pengguna < 50 orang, board < 100, dengan beban baca/tulis rendah — cukup untuk penyimpanan file JSON.
- Aplikasi berjalan di jaringan internal / satu server (single instance). File JSON **tidak** aman untuk banyak instance paralel.
- Akun dummy berarti **tidak ada** proses onboarding akun; kata sandi demo dibagikan ke tim.
- Browser yang didukung: Chrome, Edge, Firefox, Safari versi terbaru.

## 8. Risiko

| Risiko | Dampak | Mitigasi |
|--------|--------|----------|
| File JSON korup saat crash | Data hilang | Penulisan atomik (temp file + rename), backup berkala file `data/db.json` |
| Akun dummy dipakai di luar tim | Akses tidak sah | Jalankan hanya di jaringan internal; ganti `JWT_SECRET`; lihat SECURITY.md |
| Konflik edit bersamaan | Perubahan tertimpa (last-write-wins) | Refetch saat fokus tab; real-time di Phase 2 |
| Pertumbuhan data | File besar & lambat | Activity log dibatasi 500/board; migrasi ke DB di Phase 2 (layer repository sudah disiapkan) |

## 9. Kriteria Penerimaan Bisnis

1. Seluruh kebutuhan *Must* (BR-01 s.d. BR-07) terpenuhi dan diverifikasi oleh test E2E (lihat `E2E-TESTING.md`).
2. Tidak ada temuan keamanan level *High* yang terbuka (lihat `SECURITY.md`).
3. Product Owner menyetujui demo end-to-end: login → buat board → tambah list & card → drag & drop → detail card → bagikan board.

## 10. Dokumen Terkait

- [FSD.md](FSD.md) — Functional Specification
- [TSD.md](TSD.md) — Technical Specification
- [SECURITY.md](SECURITY.md) — Security Design & Checklist
- [E2E-TESTING.md](E2E-TESTING.md) — E2E Test Plan & Cases
