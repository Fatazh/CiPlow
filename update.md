# 📋 Dokumen Analisis & Rencana Pembaruan CashPlow (CiPlow)

Dokumen ini memuat catatan perbaikan terbaru, analisis celah bug & keamanan, bagian yang dapat dioptimalkan/disederhanakan, serta peta jalan (*roadmap*) pengembangan fitur aplikasi **CashPlow Budget Tracker**.

---

## 🛠️ 1. Catatan Perbaikan Terakhir (Recent Bug Fixes)

### A. Perbaikan Crash Halaman Profil (`Maximum call stack size exceeded`)
- **Masalah:** Halaman `/profile` mengalami *infinite recursive render* dan layar blank/hitam ketika dibuka via navigasi client-side.
- **Penyebab:**
  1. Adanya tag `<NuxtPage />` di dalam `pages/profile.vue` bersamaan dengan folder `pages/profile/`.
  2. Adanya wrapper `<Transition mode="out-in">` di sekeliling `<slot />` pada [layouts/default.vue](file:///c:/Users/2080/Documents/apps/cob/CiPlow/layouts/default.vue) yang bertabrakan dengan modal `<Teleport>` di halaman profil.
  3. Konfigurasi `definePageMeta({ ssr: false })` pada halaman profil yang memicu *hydration mismatch*.
- **Solusi yang Diterapkan:**
  - Memindahkan `pages/profile.vue` menjadi [pages/profile/index.vue](file:///c:/Users/2080/Documents/apps/cob/CiPlow/pages/profile/index.vue) dan menghapus tag `<NuxtPage />`.
  - Menghapus wrapper `<Transition>` pada `<slot />` di layout utama [layouts/default.vue](file:///c:/Users/2080/Documents/apps/cob/CiPlow/layouts/default.vue).
  - Menghapus `ssr: false` agar proses hidrasi SSR sinkron dan instan.

### B. Perbaikan Service Worker / PWA Workbox (`non-precached-url`)
- **Masalah:** Error konsol `Uncaught (in promise) non-precached-url :: [{"url":"/"}]`.
- **Penyebab:** Konfigurasi `navigateFallback: "/"` di Workbox mengharapkan file statis `"/"` ter-precache secara offline, sementara aplikasi berjalan dinamis pada SSR/Node server.
- **Solusi yang Diterapkan:** Mengatur `navigateFallback: null` di [nuxt.config.ts](file:///c:/Users/2080/Documents/apps/cob/CiPlow/nuxt.config.ts).

---

## 🚨 2. Analisis Celah Bug & Keamanan (Vulnerabilities & Edge Cases)

### 🔴 Keamanan (Security)
1. **Penyimpanan PIN App Lock Masih Teks Biasa (*Plain Text*)**:
   - **Lokasi:** [stores/user.ts](file:///c:/Users/2080/Documents/apps/cob/CiPlow/stores/user.ts)
   - **Kondisi Saat Ini:** PIN tersimpan di `localStorage.getItem('ciplow_app_pin')` dalam bentuk string biasa tanpa enkripsi/hashing.
   - **Risiko:** Pengguna yang membuka DevTools atau memiliki akses ke perangkat dapat langsung membaca PIN dan mematikan `isLocked` di Pinia.
   - **Rekomendasi:** Gunakan hashing (SHA-256 + salt) sebelum menyimpan PIN ke storage, atau lakukan validasi PIN di sisi server.

2. **Layanan Lupa Password Masih Bersifat Mock/Simulasi**:
   - **Lokasi:** [server/api/auth/forgot-password.post.ts](file:///c:/Users/2080/Documents/apps/cob/CiPlow/server/api/auth/forgot-password.post.ts)
   - **Kondisi Saat Ini:** Tautan reset password hanya dicetak melalui `console.log` di terminal.
   - **Rekomendasi:** Integrasikan provider email transaksional resmi (misal: Resend, SendGrid, atau Nodemailer/SMTP).

3. **Perlindungan Session Hijacking**:
   - **Lokasi:** [server/utils/auth.ts](file:///c:/Users/2080/Documents/apps/cob/CiPlow/server/utils/auth.ts)
   - **Rekomendasi:** Ikat session cookie dengan hash `User-Agent` atau IP subnet untuk mencegah penyalahgunaan session token jika cookie berhasil dicuri.

---

### 🟡 Logika Transaksi & Saldo (Transaction Logic & Edge Cases)
1. **Validasi Saldo pada Edit Transaksi (*Atomic Balance Check*)**:
   - **Lokasi:** [server/api/transactions/[id].put.ts](file:///c:/Users/2080/Documents/apps/cob/CiPlow/server/api/transactions/%5Bid%5D.put.ts)
   - **Potensi Bug:** Saat mengubah nominal transaksi lama ke nilai yang jauh lebih besar, validasi perlu memastikan saldo dompet setelah nominal lama dikembalikan tetap mencukupi untuk nominal yang baru agar saldo tidak menjadi negatif tanpa disengaja.

2. **Penanganan Kegagalan Sinkronisasi Offline**:
   - **Lokasi:** [composables/useOfflineSync.ts](file:///c:/Users/2080/Documents/apps/cob/CiPlow/composables/useOfflineSync.ts)
   - **Potensi Bug:** Jika transaksi offline gagal disinkronkan ke server (misal saldo server tidak mencukupi saat kembali online), transaksi tertahan di antrean tanpa notifikasi (*Toast/Alert*) yang jelas ke pengguna.
   - **Rekomendasi:** Tambahkan status indikator sinkronisasi gagal dan tombol *retry/edit manual* untuk transaksi pending.

3. **Konsistensi Format Tanggal & Locale**:
   - **Potensi Bug:** Penggunaan `new Date().toLocaleDateString("id-ID")` di dalam template SSR dapat memicu peringatan *Hydration mismatch* jika timezone/locale server berbeda dengan browser.
   - **Rekomendasi:** Gunakan composable terpusat [composables/useDate.ts](file:///c:/Users/2080/Documents/apps/cob/CiPlow/composables/useDate.ts) untuk seluruh pemformatan tanggal.

---

## 🧹 3. Komponen yang Redundan & Perlu Dirampingkan

1. **Penyatuan Pengaturan Mata Uang (*Currency State*)**:
   - Saat ini terdapat dua tempat yang mengelola mata uang: [composables/useCurrency.ts](file:///c:/Users/2080/Documents/apps/cob/CiPlow/composables/useCurrency.ts) dan [stores/user.ts](file:///c:/Users/2080/Documents/apps/cob/CiPlow/stores/user.ts).
   - **Rekomendasi:** Satukan seluruh state mata uang ke dalam Pinia store `useUserStore` sebagai *Single Source of Truth*.

2. **Menu Placeholder / Tombol Belum Berfungsi**:
   - Menu *Beri Rating*, *Laporkan Bug*, dan *Notifikasi* di halaman profil saat ini hanya menampilkan alert *"Fitur sedang dalam tahap pengembangan"*.
   - **Rekomendasi:** Sediakan form umpan balik / modal lapor bug sederhana via API atau arahkan ke link GitHub Issues / formulir feedback.

---

## 🚀 4. Roadmap & Rencana Pengembangan Fitur

### 📌 Fase 1: Keamanan & Keandalan (High Priority)
- [x] Penghapusan total sistem PIN App Lock yang tidak aman dan rentan di sisi klien.
- [x] Penguatan validasi saldo dompet pada endpoint update transaksi (`[id].put.ts`).
- [x] UI & state reactive feedback untuk penanganan transaksi offline (`useOfflineSync.ts`).
- [x] Integrasi provider email nyata (Gmail SMTP + Nodemailer) untuk alur Reset Password.

### 📌 Fase 2: Peningkatan Pengalaman Pengguna (Medium Priority)
- [x] **Sistem Peringatan Anggaran (Budget Alert)**: Deteksi otomatis ambang 80% & 100% dan real-time feedback toast / push notification.
- [x] **Ekspor Laporan PDF Visual**: Unduh ringkasan laporan keuangan lengkap dengan metrik visual, ringkasan kategori, dan tabel transaksi.
- [x] **Kalkulator Cepat di Input Transaksi**: Mendukung ekspresi matematika cerdas (`+`, `-`, `*`, `/`) dengan live badge preview di semua form transaksi.
- [x] **Target Tabungan / Savings Goals**: Fitur impian tabungan dengan progress bar visual, kartu dashboard, dan aksi setor/tarik saldo.

### 📌 Fase 3: Fitur Cerdas & Lanjutan (Advanced Features)
- [x] **Scan Struk Belanja Otomatis (Gemini AI Vision Receipt Scanner)**: Ekstraksi otomatis nominal, tanggal, nama merchant, dan item belanja langsung ke form transaksi.
- [x] **Pencatatan Hutang & Piutang (Debts & Loans Tracker)**: Manajemen pinjaman uang lengkap dengan tanggal jatuh tempo, histori cicilan bertahap, filter status lunas, dan integrasi saldo dompet.
- [ ] **Buku Kas Bersama (Shared/Family Budget)**: Fitur kolaborasi mencatat keuangan bersama pasangan atau keluarga.

---

*Dokumen ini diperbarui secara berkala sebagai panduan teknis dan pengembangan proyek CashPlow.*
