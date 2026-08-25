**Baca ini dalam bahasa lain:**
[English](README.md) | [Indonesian](README.id-ID.md)

# Google Calendar Desktop Widget

Widget kalender desktop bernuansa *ambient* modern untuk Windows, macOS, dan Linux berbasis Electron. Terhubung langsung dengan Google Calendar API v3 untuk menampilkan agenda harian lengkap dengan hitung mundur waktu nyata, tampilan ganda, sinkronisasi otomatis di latar belakang, dan penyimpanan cache offline.

[![GitHub Release](https://img.shields.io/github/v/release/rifarizqul-itk/google-calender-widget?style=flat-square)](https://github.com/rifarizqul-itk/google-calender-widget/releases)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-blue?style=flat-square)](#tumpukan-teknologi-tech-stack)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen?style=flat-square)](https://nodejs.org)
[![Electron Version](https://img.shields.io/badge/electron-38.x-94a3b8?style=flat-square)](https://www.electronjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](CONTRIBUTING.md)

---

## Gambaran Umum

Widget ini menghadirkan antarmuka desktop yang ringkas dan elegan untuk melihat jadwal kegiatan harian tanpa perlu membuka tab peramban (browser). Mendukung penempatan di desktop (gaya Rainmeter) maupun mode *Always on Top*, lengkap dengan sinkronisasi otomatis dan mode offline.

### Fitur Unggulan

- **Dua Mode Tampilan**: Beralih fleksibel antara garis waktu **Agenda** kronologis dengan pengelompokan hari relatif, dan kisi interaktif **Kalender Bulanan**.
- **Mesin Kontras & Warna Adaptif**: Mempertahankan palet warna asli Google Calendar dengan penyesuaian luminansi relatif standar ITU-R BT.709 agar tetap tajam dan terbaca jelas pada tema Gelap maupun Terang.
- **Dukungan Dwi-Bahasa (ID / EN)**: Penggantian bahasa instan antara Bahasa Indonesia dan Bahasa Inggris langsung dari header atau menu Pengaturan, lengkap dengan lokalisasi format tanggal/waktu.
- **Ticker Hitung Mundur Acara Terdekat**: Banner atas dengan hitung mundur waktu nyata (*countdown*) yang otomatis dijeda saat jendela diminimalkan demi efisiensi CPU 0%.
- **Peluncur Google Meet Cepat**: Tombol sekali klik untuk langsung bergabung ke konferensi video atau tautan rapat dari Google Calendar.
- **Manajemen Acara Cepat**: Tambah agenda baru (harian / sepanjang hari) dan hapus acara dengan dialog konfirmasi in-app.
- **Penyaringan Banyak Kalender**: Pilih dan saring kalender Google mana saja yang ingin ditampilkan (primer, pekerjaan, kalender bersama, hari libur) secara persisten.
- **Format Domain Cerdas**: Menampilkan nama host yang bersih untuk URL panjang atau email penyelenggara, lengkap dengan tombol salin tautan asli.
- **Ikon Vektor Presisi**: Ikon SVG *hairline* modern tanpa dekorasi berlebihan.
- **Pengubahan Ukuran Fleksibel**: 8 titik *handle* pengubah ukuran jendela dengan posisi dan dimensi yang otomatis tersimpan.
- **Siklus Akun Lengkap**: Autentikasi OAuth 2.0 loopback aman dengan batas waktu 5 menit dan opsi putuskan akun (*logout*) yang membersihkan token dan cache dari disk.

---

## Tumpukan Teknologi (Tech Stack)

| Lapisan | Teknologi |
|---|---|
| **Runtime** | Electron 38.x / Node.js 20+ |
| **API Client** | Google APIs Node.js Client (`googleapis` v176+) |
| **Autentikasi** | OAuth 2.0 (`google-auth-library`) dengan local loopback |
| **Struktur UI** | Semantic HTML5 & Vanilla JavaScript murni |
| **Gaya & Desain** | Desain CSS3 Kustom dengan Glassmorphism & Animasi Akselerasi GPU |
| **Test Runner** | Node.js Test Runner Bawaan (`node:test`) |
| **Pengemasan** | `electron-builder` 25.x (Target Windows NSIS & Portabel) |

---

## Prasyarat

- **Node.js**: Versi 20.0.0 atau lebih baru
- **npm** atau **yarn**
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
npm start
```

---

## Arsitektur Aplikasi

Proyek ini menggunakan arsitektur multi-proses Electron terisolasi dengan pembagian tugas yang ketat dan keamanan IPC berbasis hak akses minimum.

```
google-calender-widget/
├── index.js                     # Pembungkus entry point Electron utama
├── package.json                 # Konfigurasi proyek dan skrip build
├── src/
│   ├── app.js                   # Main process: siklus hidup, IPC handler, sinkronisasi latar
│   ├── preload.js               # Preload bridge aman yang mengekspos calendarWidgetAPI
│   ├── config/
│   │   └── constants.js         # Konstanta view dan konfigurasi default
│   ├── services/
│   │   ├── authService.js       # Client OAuth2, server loopback login, token storage
│   │   ├── calendarService.js   # Wrapper Google Calendar API, cache, parser agenda
│   │   ├── preferences.js       # Penyimpanan preferensi tampilan pengguna
│   │   ├── trayManager.js       # Integrasi Windows system tray dan context menu
│   │   └── windowState.js       # Pelacak ukuran dan batas koordinat layar
│   ├── utils/
│   │   ├── dateHelper.js        # Pemformat tanggal, countdown, label hari relatif
│   │   ├── debounce.js          # Utilitas debounce performa
│   │   ├── logger.js            # Pencatatan log terstruktur dan pelaporan error
│   │   └── paths.js             # Resolusi aset dan berkas lintas platform
│   └── renderer/
│       ├── widget.html          # Struktur HTML semantik untuk widget dan modal
│       ├── widget.css           # Token desain Glassmorphism, tema, tata letak
│       └── widget.js            # Controller DOM, animasi, event listener, state
├── test/                        # Pengujian unit otomatis menggunakan node:test
│   ├── constants.test.js
│   ├── dateHelper.test.js
│   ├── debounce.test.js
│   ├── logger.test.js
│   ├── paths.test.js
│   ├── preferences.test.js
│   └── windowState.test.js
└── resources/                   # Ikon dan aset aplikasi
```

---

## Skrip yang Tersedia

| Perintah | Keterangan |
|---|---|
| `npm start` | Menjalankan widget dalam mode pengembangan |
| `npm test` | Menjalankan seluruh pengujian unit otomatis (`node:test`) |
| `npm run pack` | Mengemas direktori aplikasi tanpa membuat installer |
| `npm run dist:win` | Mengompilasi installer Windows NSIS dan executable portabel |
| `npm run dist:linux` | Mengompilasi paket distribusi Linux (AppImage) |
| `npm run dist:mac` | Mengompilasi bundle aplikasi macOS |

---

## Pengujian (Testing)

Jalankan pengujian unit:

```bash
npm test
```

Cakupan pengujian meliputi:
- Konstanta view kalender dan deteksi URL
- Pemformatan agenda seharian dan agenda bertenggat waktu (EN & ID)
- Kalkulasi hari relatif (hari ini, besok, kemarin)
- Hitung mundur acara dan penanda status sedang berlangsung
- Pengatur waktu debounce dan pembatalan
- Persistensi ukuran jendela dan batasan area layar
- Pemulihan otomatis saat file preferensi JSON rusak

---

## Mengompilasi Installer Rilis

Untuk mengompilasi installer Windows dan file executable portabel:

```bash
npm run dist:win
```

Hasil kompilasi akan tersimpan di dalam folder `dist/`:
- `google-calender-widget Setup 2.0.0.exe` (Installer NSIS)
- `google-calender-widget 2.0.0.exe` (Executable Portabel)

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
3. Pastikan semua pengujian lulus: `npm test`
4. Commit perubahan Anda sesuai format [Conventional Commits](https://www.conventionalcommits.org/): `git commit -m "feat: ringkasan fitur"`
5. Push ke branch fork Anda: `git push origin feat/nama-fitur-anda`
6. Buat Pull Request baru.

---

## Lisensi

Proyek ini dilisensikan di bawah Lisensi MIT. Lihat berkas [LICENSE](LICENSE) untuk informasi selengkapnya.
