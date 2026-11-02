# Security Design & Checklist

**Produk:** FlowBoard — Aplikasi Kanban Tim
**Versi:** 1.0 · **Tanggal:** 2 November 2026
**Referensi:** [TSD.md](TSD.md)

---

## 1. Ringkasan

FlowBoard adalah aplikasi internal dengan **login dummy**. Meskipun akunnya dummy, aplikasi tetap dibangun dengan kontrol keamanan standar (OWASP ASVS L1 / OWASP Top 10) sehingga aman dijalankan di jaringan internal, dan siap ditingkatkan ke autentikasi sungguhan.

> ⚠️ **Penting:** Kata sandi akun demo (`password123`) diketahui publik melalui README dan halaman login. **Jangan** expose aplikasi ke internet dengan akun demo. Lihat §6 untuk checklist sebelum produksi.

## 2. Aset & Ancaman

| Aset | Ancaman utama |
|------|---------------|
| Data board/card/komentar | Akses oleh non-anggota (IDOR), kebocoran via XSS |
| Sesi pengguna (JWT) | Pencurian token (XSS), CSRF, brute force login |
| File lampiran | Upload file berbahaya, path traversal, stored XSS via HTML/SVG |
| File `db.json` | Korupsi data, kebocoran hash password |
| Server | DoS ringan (payload besar, spam request) |

**Trust boundary:** browser ↔ API (`/api`). Semua input dari browser dianggap tidak tepercaya dan divalidasi di server; validasi di frontend hanya untuk UX.

## 3. Kontrol yang Diimplementasikan

### 3.1 Autentikasi & Sesi

| Kontrol | Implementasi | Lokasi |
|---------|--------------|--------|
| Password di-hash | bcrypt (cost 10); hash tidak pernah dikirim ke klien | `database/seed.js`, `services/user.service.js#toPublicUser` |
| Pesan error generik | "Invalid username or password" untuk semua kegagalan | `services/auth.service.js` |
| Mitigasi timing attack | bcrypt tetap dijalankan terhadap hash dummy jika username tidak ada | `auth.service.js` (`DUMMY_HASH`) |
| Token sesi | JWT HS256, `sub` = user id, kedaluwarsa 8 jam, algoritma dikunci saat verifikasi (`algorithms: ['HS256']`) | `auth.service.js`, `middlewares/auth.middleware.js` |
| Penyimpanan token | Cookie **httpOnly** (tidak bisa dibaca JS → aman dari pencurian via XSS), **SameSite=Strict**, **Secure** di production | `controllers/auth.controller.js` |
| Secret wajib | Server menolak start di production bila `JWT_SECRET` kosong / < 32 karakter | `config/env.js` |
| User dihapus = sesi invalid | Setiap request memuat ulang user dari DB | `auth.middleware.js` |
| Rate limit login | 20 percobaan gagal / IP / 15 menit (`skipSuccessfulRequests`) | `middlewares/rateLimit.middleware.js` |
| Logout | Cookie dihapus di server | `auth.controller.js#logout` |

### 3.2 Otorisasi (Broken Access Control / IDOR)

- **Setiap** resource (list, card, checklist, komentar, lampiran) di-resolve ke board-nya lalu dicek keanggotaan: `getBoardForMember`, `getListForMember`, `getCardForMember` (`services/access.service.js`).
- Non-anggota menerima **404**, bukan 403 → ID board/card tidak bisa di-probe.
- Aksi khusus pemilik (hapus board, hapus list, hapus anggota lain) dicek `assertBoardOwner`.
- Komentar hanya bisa diedit/dihapus penulisnya.
- `labelIds` dan `memberIds` card divalidasi terhadap label/anggota board (tidak bisa menyisipkan user dari luar board).
- Diverifikasi oleh test: API (`tests/api.test.js`) dan E2E (TC-COLLAB-01, TC-COLLAB-02).

### 3.3 CSRF

1. Cookie `SameSite=Strict` → tidak dikirim pada request lintas situs.
2. **Defense-in-depth:** semua request non-GET wajib header `X-Requested-With: XMLHttpRequest` (`middlewares/csrf.middleware.js`). Form lintas situs tidak bisa menambah header kustom; `fetch` lintas origin dengan header kustom memicu preflight CORS yang ditolak.
3. CORS dibatasi ke `CORS_ORIGIN` dengan `credentials: true`.

### 3.4 Validasi Input & Injection

- Semua `params`, `query`, `body` divalidasi dengan **Zod** (tipe, panjang, enum, UUID, ISO date). Field yang tidak dikenal dibuang sebelum mencapai service (mencegah mass assignment, mis. mengubah `ownerId`).
- Body JSON dibatasi **100 KB**; JSON rusak → 400.
- Tidak ada query string ke database / eksekusi shell → tidak ada vektor SQL/NoSQL/command injection.

### 3.5 XSS

- React meng-escape semua teks; aplikasi **tidak** memakai `dangerouslySetInnerHTML`. Komentar & deskripsi ditampilkan sebagai teks biasa (diuji di TC-CARD-05 dengan payload `<b>…</b>`).
- `helmet` mengaktifkan Content-Security-Policy default, `X-Content-Type-Options: nosniff`, `X-Frame-Options`/`frame-ancestors`, `Referrer-Policy`, HSTS (production), dsb.
- Token tidak dapat dicuri via XSS karena cookie httpOnly (diuji di TC-AUTH-06).
- Redirect pasca-login hanya menerima path internal (mencegah open redirect).

### 3.6 Upload File

| Risiko | Kontrol |
|--------|---------|
| File berbahaya (HTML/SVG/JS) | **Allowlist** MIME type (gambar raster, PDF, Office, TXT, CSV, ZIP). HTML & SVG ditolak (diuji TC-CARD-08) |
| Path traversal / overwrite | Nama file di disk = `UUID + ekstensi tersanitasi`; nama asli hanya disimpan sebagai metadata; `path.basename` saat membaca |
| Stored XSS saat diunduh | Default `Content-Disposition: attachment`; `inline` hanya untuk PNG/JPEG/GIF/WEBP; header CSP ketat `default-src 'none'` + `nosniff` pada respons file |
| Akses tanpa izin | File tidak disajikan statis; diunduh lewat endpoint yang mengecek sesi & keanggotaan board |
| DoS ukuran | Maks 10 MB, 1 file per request |
| File yatim | File dihapus dari disk saat lampiran/card/list/board dihapus |

### 3.7 Lain-lain

- `x-powered-by` dimatikan; stack trace tidak pernah dikirim ke klien di production.
- Rate limit umum 2.000 request / 15 menit / IP untuk `/api`.
- Penulisan `db.json` atomik (temp + rename) mencegah file korup saat crash.
- Activity log dibatasi 500 entri/board (mencegah pertumbuhan tak terbatas).
- `localStorage` hanya untuk preferensi non-sensitif (daftar board terakhir dibuka), dibungkus try/catch.

## 4. Pemetaan OWASP Top 10 (2021)

| Kategori | Status | Catatan |
|----------|--------|---------|
| A01 Broken Access Control | ✅ Dimitigasi | Cek keanggotaan di service layer, 404 untuk non-anggota |
| A02 Cryptographic Failures | ✅ / ⚠️ | bcrypt + JWT HS256; HTTPS wajib disediakan oleh reverse proxy di production |
| A03 Injection | ✅ | Zod + tanpa query engine; React escaping |
| A04 Insecure Design | ⚠️ | Akun dummy dengan password publik — **by design** untuk Phase 1 |
| A05 Security Misconfiguration | ✅ | helmet, CORS ketat, secret wajib di prod |
| A06 Vulnerable Components | ⚠️ Proses | Jalankan `npm audit` rutin / Dependabot |
| A07 Identification & Auth Failures | ✅ / ⚠️ | Rate limit, pesan generik; belum ada MFA/lockout per akun |
| A08 Software & Data Integrity | ✅ | Lockfile `package-lock.json`; tidak ada deserialisasi tak tepercaya |
| A09 Logging & Monitoring | ⚠️ | Access log via morgan; belum ada audit log keamanan terpusat |
| A10 SSRF | ✅ N/A | Server tidak melakukan request keluar berdasarkan input pengguna |

## 5. Risiko yang Diterima (Phase 1)

| ID | Risiko | Alasan diterima | Rencana |
|----|--------|-----------------|---------|
| R-01 | Password demo diketahui umum | Kebutuhan bisnis: login dummy | Ganti dengan SSO / akun nyata |
| R-02 | JWT tidak bisa dicabut sebelum kedaluwarsa (kecuali user dihapus) | Sederhana, masa berlaku 8 jam | Session store / token denylist |
| R-03 | Tidak ada pemindaian antivirus lampiran | Lingkungan internal | Integrasi ClamAV / layanan scan |
| R-04 | File `db.json` berisi hash password tanpa enkripsi at-rest | Akun dummy | Enkripsi disk / pindah ke DB terkelola |
| R-05 | Semua pengguna terdaftar terlihat di pencarian "Share" | Direktori tim internal | Batasi ke anggota workspace |

## 6. Checklist Sebelum Production

- [ ] Ganti autentikasi dummy (hapus/ubah akun demo, atau integrasi SSO).
- [ ] Set `NODE_ENV=production` dan `JWT_SECRET` acak ≥ 32 karakter (`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`).
- [ ] Jalankan di belakang reverse proxy **HTTPS** (Nginx/Caddy); cookie `Secure` aktif otomatis.
- [ ] Set `CORS_ORIGIN` ke domain sebenarnya.
- [ ] Batasi akses jaringan (VPN / IP allowlist) selama masih memakai akun dummy.
- [ ] Backup terjadwal `backend/data/db.json` dan folder `backend/uploads/`.
- [ ] Hak akses file: hanya user service yang dapat membaca `data/` & `uploads/`.
- [ ] `npm audit --omit=dev` tanpa temuan High/Critical.
- [ ] Monitoring log & alert untuk lonjakan 401/429/500.

## 7. Pengujian Keamanan

| Uji | Cara | Otomatis? |
|-----|------|-----------|
| Kredensial salah → pesan generik | TC-AUTH-02, `api.test.js` | ✅ |
| Cookie httpOnly + SameSite=Strict | TC-AUTH-06, `api.test.js` | ✅ |
| Tanpa header anti-CSRF → 403 | `api.test.js` | ✅ |
| Non-anggota → 404 | TC-COLLAB-01, `api.test.js` | ✅ |
| Hanya pemilik hapus board → 403 | `api.test.js`, TC-COLLAB-02 | ✅ |
| Validasi input (judul kosong, UUID salah) → 400 | `api.test.js` | ✅ |
| Upload HTML ditolak | TC-CARD-08 | ✅ |
| Payload HTML di komentar tampil sebagai teks | TC-CARD-05 | ✅ |
| Dependency scan | `npm audit` | Manual / CI |

## 8. Pelaporan Kerentanan

Laporkan temuan ke tim engineering melalui kanal internal (jangan di issue publik). Sertakan langkah reproduksi, dampak, dan versi aplikasi.
