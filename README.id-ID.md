**Baca ini dalam bahasa lain:**
[English](README.md) | [Indonesian](README.id-ID.md)

# Google Calendar Desktop Widget

Widget kalender desktop bernuansa *ambient* modern untuk Windows, macOS, dan Linux berbasis Tauri v2 & Rust. Terhubung langsung dengan Google Calendar API v3 untuk menampilkan agenda harian lengkap dengan hitung mundur waktu nyata, tampilan ganda, sinkronisasi otomatis di latar belakang, dan penyimpanan cache offline.

[![GitHub Release](https://img.shields.io/github/v/release/rifarizqul-itk/google-calender-widget?style=flat-square)](https://github.com/rifarizqul-itk/google-calender-widget/releases)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-blue?style=flat-square)](#tumpukan-teknologi-tech-stack)
[![Tauri Version](https://img.shields.io/badge/tauri-2.x-brightgreen?style=flat-square)](https://tauri.app)
[![Rust](https://img.shields.io/badge/rust-2021%20edition-orange?style=flat-square)](https://www.rust-lang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](CONTRIBUTING.md)

---

## Gambaran Umum

Widget ini menghadirkan antarmuka desktop yang ringkas dan elegan untuk melihat jadwal kegiatan harian tanpa perlu membuka tab peramban (browser). Mendukung penempatan di desktop (gaya Rainmeter) maupun mode *Always on Top*, lengkap dengan sinkronisasi otomatis dan mode offline.

### Fitur Unggulan
 
- **Tiga Mode Tampilan**: Beralih fleksibel antara garis waktu **Agenda** kronologis, kisi interaktif **Kalender Bulanan**, dan pelacak **Minggu Perkuliahan (Semester)**.
- **Pelacak Minggu Perkuliahan (Semester Tracker)**: Mendeteksi kalender semester aktif secara otomatis (contoh: `SEMESTER 5 - 2026/2027`), menghitung minggu berjalan (Minggu 1–16/17), menyorot minggu aktif, dan menampilkan chip minggu langsung di banner atas lengkap dengan opsi override manual tanggal mulai & jumlah minggu di Pengaturan.
- **Edit Acara Lengkap & Modal Instan**: Tambah dan edit judul, waktu, status seharian, lokasi, dan deskripsi acara langsung dari widget dengan popup form instan (0ms) yang tersinkronisasi ke Google Calendar API v3.
- **Footprint Memori Ekstrem Hemat**: Didukung oleh Tauri v2 dan Rust murni, hanya membutuhkan ~30–40 MB RAM (turun >80% dari Electron) dengan ukuran biner ~10 MB.
- **Penjelajahan Jadwal Riwayat**: Lihat acara masa lalu di tab Kalender dengan titik indikator warna dan efek hover bersih tanpa visual clutter.
- **Mesin Kontras & Warna Adaptif**: Mempertahankan palet warna asli Google Calendar dengan penyesuaian luminansi relatif standar ITU-R BT.709 agar tetap tajam dan terbaca jelas pada tema Gelap maupun Terang.
- **Editor Deskripsi Fleksibel & Bersih**: Kotak input deskripsi yang otomatis menyesuaikan tinggi teks (hingga 180px) dengan scrollbar elegan dan pembersihan otomatis tag HTML kotor menjadi teks berpoin rapi.
- **Pemotongan Cerdas URL & Nama Kalender**: Mencegah dropdown kalender melebar ke seluruh layar saat memuat nama URL webcal panjang.
- **Dukungan Dwi-Bahasa (ID / EN)**: Penggantian bahasa instan antara Bahasa Indonesia dan Bahasa Inggris langsung dari header atau menu Pengaturan, lengkap dengan lokalisasi format tanggal/waktu.
- **Ticker Hitung Mundur Acara Terdekat**: Banner atas dengan hitung mundur waktu nyata (*countdown*) dan lencana dinamis "SEGERA / BERJALAN".
- **Peluncur Google Meet Cepat**: Tombol sekali klik untuk langsung bergabung ke konferensi video atau tautan rapat dari Google Calendar.
- **Penyaringan Banyak Kalender**: Pilih dan saring kalender Google mana saja yang ingin ditampilkan (primer, pekerjaan, kalender bersama, hari libur) secara persisten.
- **Pengubahan Ukuran Fleksibel**: 8 titik *handle* pengubah ukuran jendela dengan posisi dan dimensi yang otomatis tersimpan.
- **Siklus Akun Lengkap**: Autentikasi OAuth 2.0 loopback aman dengan batas waktu 5 menit dan opsi putuskan akun (*logout*) yang membersihkan token dan cache dari disk.

---

## Tumpukan Teknologi (Tech Stack)

| Lapisan | Teknologi |
|---|---|
| **Runtime** | Tauri v2 (Rust 2021) |
| **API Client** | Native Rust `reqwest` (dengan `rustls-tls`) |
| **Autentikasi** | OAuth 2.0 dengan local loopback |
| **Struktur UI** | Semantic HTML5 & Vanilla JavaScript murni |
| **Gaya & Desain** | Desain CSS3 Kustom dengan Glassmorphism & Animasi Akselerasi GPU |
| **Pengemasan** | Tauri CLI / Cargo Release |

---

## Prasyarat

- **Rust & Cargo**: Instal melalui [rustup.rs](https://rustup.rs/)
- **Tauri v2 CLI**: `cargo install tauri-cli --version '^2'` (atau via `npm i @tauri-apps/cli`)
- **WebView2 Runtime** *(Windows)*: Sudah terinstal di Windows 10+. Jika belum, unduh dari [Microsoft](https://developer.microsoft.com/en-us/microsoft-edge/webview2/).
- **Akun Google & Project Google Cloud**: Digunakan untuk membuat kredensial `client_secret.json` sendiri (Mode BYOK - Bring Your Own Key).

---

## Panduan Setup Google Cloud Console (BYOK Mode)

Widget ini mengusung arsitektur **Bring Your Own Key (BYOK)** demi privasi dan keamanan data Anda. Anda memegang kendali penuh atas kredensial Google API tanpa bergantung pada server pihak ketiga.

Ikuti langkah-langkah mudah berikut untuk membuat `client_secret.json` secara gratis di Google Cloud Console:

### 1. Buat Project Baru
1. Buka [Google Cloud Console](https://console.cloud.google.com/).
2. Pada menu navigasi atas, klik dropdown project dan pilih **New Project**.
3. Beri nama project (contoh: `Desktop Calendar Widget`), lalu klik **Create**.

### 2. Aktifkan Google Calendar API
1. Buka menu samping kiri: **APIs & Services > Library**.
2. Ketik `Google Calendar API` pada bilah pencarian.
3. Pilih **Google Calendar API** lalu klik tombol biru **Enable**.

### 3. Konfigurasi Layar Persetujuan (OAuth Consent Screen)
1. Buka menu: **APIs & Services > OAuth consent screen**.
2. Pilih User Type: **External**, lalu klik **Create**.
3. Masukkan data aplikasi:
   - **App name**: `Google Calendar Desktop Widget`
   - **User support email**: Pilih alamat email Google Anda.
   - **Developer contact information**: Masukkan alamat email Anda.
4. Klik **Save and Continue** melewati langkah Scopes.
5. Pada halaman **Test Users**, klik tombol **+ ADD USERS**, lalu masukkan email Google yang akan digunakan untuk masuk ke widget.
6. Klik **Save and Continue** hingga selesai (*Kembali ke Dashboard*).

### 4. Buat OAuth 2.0 Client ID (Desktop App)
1. Buka menu: **APIs & Services > Credentials**.
2. Klik tombol **+ CREATE CREDENTIALS** di bagian atas, pilih opsi **OAuth client ID**.
3. Pada menu dropdown **Application type**, pilih **Desktop app**.
4. Masukkan nama klien (contoh: `Calendar Desktop Client`), lalu klik **Create**.
5. Jendela popup konfirmasi akan muncul. Klik **DOWNLOAD JSON** untuk mengunduh berkas kredensial.

### 5. Pasang File `client_secret.json` ke Widget
1. Ubah nama berkas JSON yang telah diunduh menjadi **`client_secret.json`**.
2. Pindahkan file tersebut ke salah satu lokasi berikut:
   - **Pengguna Installer Windows**: Tekan tombol `Win + R`, ketik `%APPDATA%\google-calender-widget`, lalu paste file `client_secret.json` ke folder tersebut (atau klik tombol **Buka Folder Kredensial** di layar widget).
   - **Pengembang / Git Clone**: Taruh berkas `client_secret.json` langsung di root folder project `google-calender-widget/`.

### 6. Masuk & Sinkronisasi
Buka aplikasi widget, klik **Masuk dengan Google**, dan izinkan akses melalui browser Anda. Jadwal agenda harian Anda akan langsung tersinkronisasi di desktop!

---

## Memulai Pengembangan (Development)

### 1. Kloning Repositori

```bash
git clone https://github.com/rifarizqul-itk/google-calender-widget.git
cd google-calender-widget
```

### 2. Pasang Dependensi

```bash
npm install
```

### 3. Letakkan Kredensial

Pastikan file `client_secret.json` hasil langkah di atas telah ditempatkan di root direktori project.

> File `.gitignore` telah dikonfigurasi untuk mengecualikan `client_secret*.json` dan `google_tokens.json` sehingga kredensial pribadi Anda aman dari commit git.

### 4. Jalankan Widget

```bash
npm run dev
# atau langsung via Cargo:
cargo tauri dev
```

---

## Arsitektur Aplikasi

Proyek ini menggunakan arsitektur Tauri v2 dengan backend Rust terisolasi dan renderer frontend WebView2.

```
google-calender-widget/
├── package.json                 # Peralatan JS dan skrip Tauri CLI
├── src-tauri/                   # Backend Rust native
│   ├── Cargo.toml               # Manifes crate Rust dan dependensi
│   ├── tauri.conf.json          # Konfigurasi app, jendela, dan bundle Tauri
│   ├── build.rs                 # Build script Tauri
│   ├── capabilities/
│   │   └── default.json         # Izin kapabilitas Tauri
│   ├── icons/                   # Aset ikon aplikasi
│   └── src/
│       ├── main.rs              # Entry point: penegakan single-instance, mutex guard
│       ├── lib.rs               # Setup app Tauri, tray, pemulihan jendela, auto-sync
│       ├── tray.rs              # Menu system tray dan event handler
│       ├── paths.rs             # Resolver direktori data aplikasi lintas platform
│       └── commands/
│           ├── auth.rs          # Server loopback OAuth2, penyimpanan & refresh token
│           ├── calendar.rs      # Client Google Calendar API v3, caching event
│           ├── academic.rs      # Logika pelacak minggu semester
│           ├── window.rs        # Perintah IPC drag, resize, dan pin jendela
│           ├── system.rs        # Auto-launch, pembuka folder log & kredensial
│           └── http_client.rs   # HTTP client reqwest async bersama
└── src/renderer/                # Frontend (HTML/CSS/JS dirender oleh WebView2)
    ├── index.html               # Entry point app yang dimuat Tauri
    ├── widget.html              # Struktur HTML semantik untuk widget dan modal
    ├── widget.css               # Token desain Glassmorphism, tema, tata letak
    ├── widget.js                # Controller DOM, animasi, event listener, state
    └── tauri-bridge.js          # Jembatan Tauri JS API dan pembungkus perintah IPC
```

---

## Skrip yang Tersedia

| Perintah | Keterangan |
|---|---|
| `npm run dev` | Menjalankan widget dalam mode pengembangan (hot reload) |
| `npm run build` | Mengompilasi binary rilis dan paket installer |
| `cargo tauri dev` | Alternatif: jalankan mode dev langsung via Cargo |

---

## Mengompilasi Installer Rilis

Untuk mengompilasi installer Windows dan file executable portabel:

```bash
npm run build
# atau:
cargo tauri build
```

Hasil kompilasi akan tersimpan di dalam folder `src-tauri/target/release/bundle/`:
- `nsis/google-calender-widget_x.x.x_x64-setup.exe` (Installer NSIS)
- `msi/google-calender-widget_x.x.x_x64_en-US.msi` (Paket MSI)
- `target/release/app.exe` (Executable Portabel)

---

## Pemecahan Masalah (Troubleshooting)

### "File client_secret.json belum ditemukan"
Pastikan file kredensial OAuth dari Google Cloud Console telah ditaruh di folder `%APPDATA%\google-calender-widget\` atau root folder project dengan nama `client_secret.json`.

### Posisi jendela terlempar keluar layar setelah mengubah monitor
Klik kanan pada ikon system tray (pojok kanan bawah taskbar), lalu pilih **Reset Ukuran Standar (360x580)** untuk mengembalikan posisi widget ke tengah monitor utama.

### "Error: Waktu otorisasi Google login habis"
Server autentikasi internal memiliki batas waktu 5 menit untuk alasan keamanan. Jika proses persetujuan di browser memakan waktu lebih dari 5 menit, silakan klik tombol **Masuk dengan Google** sekali lagi di widget.

### Memeriksa File Log
Klik ikon pengaturan di header widget, lalu klik tombol **Folder Kredensial** atau **Buka Folder Log** untuk membuka direktori terkait di Windows Explorer.

---

## Kontribusi

1. Fork repositori: `https://github.com/rifarizqul-itk/google-calender-widget`
2. Buat branch fitur Anda: `git checkout -b feat/nama-fitur-anda`
3. Build dan verifikasi: `npm run build`
4. Commit perubahan Anda sesuai format [Conventional Commits](https://www.conventionalcommits.org/): `git commit -m "feat: ringkasan fitur"`
5. Push ke branch fork Anda: `git push origin feat/nama-fitur-anda`
6. Buat Pull Request baru.

---

## Lisensi

Proyek ini dilisensikan di bawah Lisensi MIT. Lihat berkas [LICENSE](LICENSE) untuk informasi selengkapnya.
