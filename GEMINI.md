# GEMINI.md — CashPlow Project Instructions

Dokumen ini berisi panduan dan instruksi teknis untuk pengembangan proyek **CashPlow**, sebuah aplikasi pelacak anggaran (Budget Tracker) berbasis Nuxt.

## 📋 Ikhtisar Proyek
**CashPlow** adalah aplikasi manajemen keuangan pribadi yang memungkinkan pengguna mencatat pengeluaran, pemasukan, dan transfer antar dompet. Aplikasi ini mendukung fitur PWA, mode gelap, dan analisis data melalui grafik.

### 🛠️ Tumpukan Teknologi (Tech Stack)
- **Framework:** [Nuxt 4](https://nuxt.com/) (Vue 3)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **ORM:** [Prisma](https://www.prisma.io/) dengan PostgreSQL
- **State Management:** [Pinia](https://pinia.vuejs.org/)
- **PWA:** [@vite-pwa/nuxt](https://vite-pwa-org.netlify.app/frameworks/nuxt.html)
- **UI Components:** Lucide Icons, Chart.js (via `vue-chartjs`)

## 🏗️ Arsitektur & Struktur
- `pages/`: Halaman aplikasi (Nuxt routing).
- `components/`: Komponen UI yang dapat digunakan kembali, dikelompokkan berdasarkan fitur (`dashboard/`, `ui/`, `analytics/`, dll).
- `composables/`: Logika bisnis yang dapat dibagikan (Shared logic) seperti `useAuth`, `useCurrency`.
- `stores/`: Manajemen state global menggunakan Pinia.
- `server/api/`: Endpoint backend (Nitro server engine).
- `prisma/`: Skema database dan skrip seeding.

## 🚀 Perintah Utama (Key Commands)
- `npm run dev`: Menjalankan server pengembangan lokal.
- `npm run build`: Membangun aplikasi untuk produksi.
- `npm run postinstall`: Menghasilkan Prisma Client dan menyiapkan Nuxt.
- `npm run db:seed`: Mengisi database dengan data awal.
- `npx prisma db push`: Menyingkronkan skema Prisma dengan database.

## ✍️ Konvensi Pengembangan
- **Bahasa Respon:** Selalu merespons dalam **Bahasa Indonesia** sesuai dengan preferensi pengguna.
- **Kualitas Kode:** Pastikan tipe TypeScript benar. Gunakan composables untuk logika yang kompleks.
- **Validasi:** Gunakan `canSubmit` computed property untuk validasi form (seperti di halaman login/register).
- **Keamanan:** Jangan pernah menyimpan rahasia atau API key di dalam repositori. Gunakan `.env`.

## ⚠️ Catatan Penting
- Aplikasi menggunakan `nuxt-csurf` untuk perlindungan CSRF.
- Pastikan database PostgreSQL sudah dikonfigurasi di `DATABASE_URL` sebelum menjalankan aplikasi.
- Terdapat sistem penguncian aplikasi (PIN) yang dikelola di `stores/user.ts` dan `middleware/lock.global.ts`.

---
*Dokumen ini dihasilkan secara otomatis untuk membantu navigasi dan pengembangan proyek.*
