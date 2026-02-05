# Emes CBT - Aplikasi Ujian Sekolah Berbasis Cloud

Emes CBT adalah sistem Computer-Based Test (CBT) berbasis SaaS (Software as a Service) yang dirancang untuk kebutuhan sekolah di Indonesia. Aplikasi ini dibangun dengan stack teknologi modern untuk memastikan skalabilitas, keamanan, dan kemudahan penggunaan.

## Fitur Utama

- **Multi-Tenant Architecture**: Mendukung banyak sekolah dalam satu platform terisolasi.
- **Manajemen Pengguna Berbasis Peran**: Super Admin, Admin Sekolah, Guru, Proktor, Pengawas, dan Siswa.
- **Bank Soal Terstruktur**: Kelola ribuan butir soal berdasarkan mata pelajaran dan tingkat kelas.
- **Mode Ujian Hybrid**: Mendukung pelaksanaan ujian secara online penuh maupun semi-offline untuk mengatasi kendala koneksi internet.
- **Keamanan Ujian**: Dilengkapi dengan token sesi, mode layar penuh, dan deteksi kecurangan.
- **Analisis Psikometrik**: Laporan analisis butir soal dan tingkat kesukaran otomatis.

## Setup & Instalasi Lokal

Untuk menjalankan aplikasi ini di lingkungan pengembangan lokal, ikuti langkah-langkah berikut:

1.  **Clone Repository**
    ```bash
    git clone [URL_REPOSITORY_ANDA]
    cd [NAMA_FOLDER_REPOSITORY]
    ```

2.  **Install Dependencies**
    Aplikasi ini menggunakan `npm` sebagai package manager.
    ```bash
    npm install
    ```

3.  **Konfigurasi Environment**
    - Buat file `.env.local` di root direktori proyek.
    - Salin konten dari file `.env.example` (jika ada) atau gunakan template di bawah ini.
    - Isi variabel environment dengan kredensial dari proyek Supabase Anda.

4.  **Setup Database Supabase**
    - Login ke akun Supabase Anda dan buat proyek baru.
    - Buka **SQL Editor** di dashboard Supabase.
    - Salin seluruh konten dari file `schema.sql` dan jalankan di editor untuk membuat semua tabel, fungsi, dan kebijakan RLS yang diperlukan.

5.  **Jalankan Aplikasi**
    ```bash
    npm run dev
    ```
    Aplikasi akan berjalan di `http://localhost:5173` (atau port lain yang tersedia).

## Variabel Environment

Berikut adalah daftar variabel environment yang wajib diisi dalam file `.env.local`:

```
# URL proyek Supabase Anda
# Dapat ditemukan di: Project Settings > API > Project URL
VITE_SUPABASE_URL="https://xxxxxxxxxxxxxxxxxxxx.supabase.co"

# Kunci Anon (public) proyek Supabase Anda
# Dapat ditemukan di: Project Settings > API > Project API Keys > anon public
VITE_SUPABASE_ANON_KEY="ey...xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

## Panduan Deployment ke Vercel

Aplikasi ini dirancang untuk kemudahan deployment di platform Vercel.

1.  **Hubungkan Git Repository**
    - Push kode Anda ke repository GitHub/GitLab/Bitbucket.
    - Di dashboard Vercel, klik "Add New... > Project".
    - Pilih repository yang baru saja Anda push.

2.  **Konfigurasi Proyek**
    - Vercel akan secara otomatis mendeteksi bahwa ini adalah proyek Vite. **Framework Preset** akan diatur ke **Vite**.
    - Biarkan pengaturan build & output default.

3.  **Tambahkan Environment Variables**
    - Buka tab **Settings > Environment Variables** di proyek Vercel Anda.
    - Tambahkan `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` dengan value yang sama seperti di file `.env.local` Anda.

4.  **Konfigurasi Rewrites (Penting)**
    - Aplikasi ini adalah Single Page Application (SPA). Untuk menangani routing di sisi klien, semua path harus diarahkan ke `index.html`.
    - Buat file `vercel.json` di root direktori proyek Anda dengan konten berikut:
      ```json
      {
        "rewrites": [
          {
            "source": "/(.*)",
            "destination": "/index.html"
          }
        ]
      }
      ```
    - File ini sudah ada di dalam repository, jadi Anda tidak perlu membuatnya lagi.

5.  **Deploy**
    - Klik tombol "Deploy". Vercel akan memulai proses build dan deployment.
    - Setelah selesai, aplikasi Anda akan live di domain yang disediakan Vercel.
