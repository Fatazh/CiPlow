# CashPlow 💸

CashPlow (juga dikenal sebagai PPLow) adalah aplikasi pencatatan keuangan (Budget Tracker) modern berbasis web yang dirancang untuk membantu Anda memantau pengeluaran, pemasukan, dan transfer antar dompet dengan antarmuka yang bersih, responsif, dan mudah digunakan.

Aplikasi ini dibangun menggunakan tumpukan teknologi modern dengan performa tinggi dan siap diinstal sebagai aplikasi mandiri (PWA) di perangkat Anda.

## ✨ Fitur Utama

- 🔐 **Autentikasi Aman**: Login dan registrasi pengguna dengan manajemen sesi yang ketat (kedaluwarsa otomatis dalam 3 hari untuk keamanan).
- 📊 **Dashboard & Analitik Interaktif**: Visualisasi data keuangan Anda menggunakan grafik Donut dan tren mingguan/bulanan.
- 💳 **Manajemen Dompet & Kategori**: Buat dan kelola berbagai sumber dana (Tunai, Bank, E-Wallet) dan kategori pengeluaran/pemasukan.
- 📝 **Pencatatan Transaksi Detail**: 
  - Dukungan untuk Pengeluaran (Expense), Pemasukan (Income), dan Transfer.
  - Validasi pintar (mencegah pengeluaran melebihi saldo).
  - Kalkulasi otomatis untuk jumlah barang dan harga satuan.
  - Dukungan kode promo (Diskon %, Potongan Harga, atau Beli X Gratis Y).
- 📥 **Import & Export**: Ekspor data Anda ke Excel atau impor data transaksi lama dengan mudah.
- 📱 **PWA Ready**: Bisa diinstal langsung ke Home Screen HP Anda (Android/iOS) untuk pengalaman *fullscreen* layaknya aplikasi *native*.
- 🌓 **Mode Gelap (Dark Mode)**: Dukungan tampilan mode gelap otomatis sesuai dengan preferensi sistem Anda.

## 🛠️ Teknologi yang Digunakan

- **Frontend:** [Nuxt 3](https://nuxt.com/) / Vue 3
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Backend/API:** Nitro (Bawaan Nuxt)
- **Database ORM:** [Prisma](https://www.prisma.io/) (v7)
- **Database:** PostgreSQL
- **Ikon & UI:** SVG kustom dengan elemen Glassmorphism

## 🚀 Cara Menjalankan di Lokal (Development)

### Persyaratan Sistem
- Node.js (v18 atau lebih baru)
- Database PostgreSQL (Lokal atau Cloud seperti Neon/Supabase)

### Langkah-langkah

1. **Clone Repositori**
   ```bash
   git clone https://github.com/username-anda/cashplow.git
   cd cashplow
   ```

2. **Instal Dependensi**
   ```bash
   npm install
   ```

3. **Konfigurasi Environment**
   Salin file `.env.example` menjadi `.env` dan sesuaikan koneksi database Anda:
   ```bash
   cp .env.example .env
   ```
   *Isi `DATABASE_URL` di dalam file `.env` dengan URL koneksi PostgreSQL Anda.*

4. **Persiapkan Database (Prisma)**
   Jalankan migrasi database dan hasilkan Prisma Client:
   ```bash
   npm run postinstall
   npx prisma db push
   ```

5. **Isi Data Awal (Seeding)** *(Opsional)*
   Jika Anda ingin mengisi database dengan data *dummy* (User, Dompet, Kategori):
   ```bash
   npm run db:seed
   ```

6. **Jalankan Server Lokal**
   ```bash
   npm run dev
   ```
   Aplikasi akan berjalan di `http://localhost:3000`.

## ☁️ Deployment (Vercel)

Aplikasi ini sudah dikonfigurasi untuk *deployment* mudah menggunakan Vercel. 
File `vercel.json` dan skrip `vercel-build` di `package.json` akan memastikan Prisma *generate* dan sinkronisasi database berjalan otomatis saat *build*.

1. Hubungkan repositori GitHub ini ke proyek baru di Vercel.
2. Di Dashboard Vercel, masuk ke **Settings > Environment Variables**.
3. Tambahkan variabel `DATABASE_URL` yang mengarah ke database PostgreSQL _production_ Anda.
4. Klik **Deploy**.

## 📄 Lisensi

Proyek ini dibuat untuk keperluan personal/portofolio. Hak Cipta dilindungi.
