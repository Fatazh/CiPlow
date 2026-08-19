# 📋 Dokumen Analisis & Rencana Pembaruan CashPlow (CiPlow)

Dokumen ini memuat catatan perbaikan terbaru, analisis celah bug & keamanan, bagian yang dapat dioptimalkan/disederhanakan, serta peta jalan (*roadmap*) pengembangan fitur aplikasi **CashPlow Budget Tracker**.

---

## 🚀 1. Catatan Fitur Baru & Peningkatan (Rilis Versi 1.2.5)

### A. Haptic Feedback Engine (`utils/haptics.ts`)
- **Umpan Balik Taktil Sentuh:** Memberikan respons getaran mikro halus pada smartphone saat berinteraksi dengan tombol navigasi, keypad kalkulator, switch tab kalender, dan simpan transaksi.

### B. FAB Speed-Dial Action Menu ([components/layout/BottomNav.vue](file:///c:/Users/2080/Documents/apps/cob/CiPlow/components/layout/BottomNav.vue))
- **Aksi Cepat 1-Klik:** Tombol mengambang (+) kini membuka speed dial melayang interaktif untuk langsung mencatat *Pengeluaran*, *Pemasukan*, *Transfer Dompet*, *Scan Struk AI*, atau membuka kalkulator *Bagi Tagihan*.

### C. Proyeksi Arus Kas Akhir Bulan (*Cashflow Forecast*)
- **Komponen Cerdas:** [components/analytics/CashflowForecastCard.vue](file:///c:/Users/2080/Documents/apps/cob/CiPlow/components/analytics/CashflowForecastCard.vue) di halaman Analitik menghitung sisa hari, laju pengeluaran harian (*burn rate*), tagihan berulang yang belum jatuh tempo, status kesehatan finansial (*Surplus Aman / Waspada / Defisit*), dan batas aman belanja harian.

### D. Kalkulator Bagi Tagihan (*Split Bill Calculator*)
- **Komponen:** [components/transactions/SplitBillModal.vue](file:///c:/Users/2080/Documents/apps/cob/CiPlow/components/transactions/SplitBillModal.vue) mempermudah membagi tagihan makan bersama/belanja kelompok dengan kalkulasi otomatis PPN % & Service Charge %, bagi rata atau kustom, tombol pintas catat piutang otomatis, serta tombol salin format pesan WhatsApp.

### E. Indikator Progress Bar Anggaran Adaptif & Glow Alert
- **Komponen:** [components/dashboard/BudgetProgress.vue](file:///c:/Users/2080/Documents/apps/cob/CiPlow/components/dashboard/BudgetProgress.vue) dilengkapi efek *pulsing glow* dan *ring alert* dinamis saat pengeluaran mendekati 85% atau melampaui 100%.

### F. Kompresi Gambar Struk Client-Side ([utils/imageCompressor.ts](file:///c:/Users/2080/Documents/apps/cob/CiPlow/utils/imageCompressor.ts))
- **Optimasi Ukuran Berkas:** Foto kamera ponsel resolusi tinggi (4–8 MB) otomatis dikompresi menjadi ~60–120 KB sebelum disimpan ke database, menjaga performa kueri tetap super cepat.

### G. Optimasi Database Compound Indexing
- **Performa Kueri Tinggi:** Penambahan multi-column compound index `[userId, date, type]`, `[userId, categoryId]`, `[userId, status]`, `[userId, dueDate]`, dan `[userId, isCompleted]` pada PostgreSQL via Prisma.

---

## 🎨 2. Catatan Rilis Versi 1.2.4 (Sebelumnya)

### A. Tema Warna Kustom (Accent Theme Engine)
- **Token Variabel CSS Dinamis:** Tailwind CSS `primary` dikonfigurasi dinamis mengarah ke CSS variables di [tailwind.config.ts](file:///c:/Users/2080/Documents/apps/cob/CiPlow/tailwind.config.ts) & [assets/css/main.css](file:///c:/Users/2080/Documents/apps/cob/CiPlow/assets/css/main.css).
- **5 Pilihan Aksen:** *Emerald (Default)*, *Ocean Blue*, *Violet Luxury*, *Amber Gold*, dan *Rose Passion*.
- **Manajemen State:** Dikelola di Pinia Store [stores/user.ts](file:///c:/Users/2080/Documents/apps/cob/CiPlow/stores/user.ts) dengan persistensi `localStorage` dan pemilih tema visual di [pages/profile/index.vue](file:///c:/Users/2080/Documents/apps/cob/CiPlow/pages/profile/index.vue).

### B. Kalender Finansial Interaktif (*Interactive Financial Calendar*)
- **Komponen Visual:** [components/transactions/TransactionCalendarView.vue](file:///c:/Users/2080/Documents/apps/cob/CiPlow/components/transactions/TransactionCalendarView.vue) menampilkan matriks tanggal bulanan lengkap dengan ringkasan pemasukan hijau dan pengeluaran merah per hari.
- **Navigasi Cepat:** Switcher `[📑 Daftar Transaksi | 📅 Kalender Keuangan]` di [pages/transactions.vue](file:///c:/Users/2080/Documents/apps/cob/CiPlow/pages/transactions.vue) serta pop-up kartu detail riwayat transaksi saat suatu tanggal diklik.

### C. Sistem Label / Tagging Kustom Transaksi (`#tags`)
- **Skema Database:** Kolom `tags String[] @default([])` pada model `Transaction` di Prisma schema.
- **Input Chips:** Kemudahan menambah/menghapus tag fleksibel (misal: `#Liburan`, `#Kuliner`, `#Project`) di [pages/add-transaction.vue](file:///c:/Users/2080/Documents/apps/cob/CiPlow/pages/add-transaction.vue) dan [pages/edit-transaction/[id].vue](file:///c:/Users/2080/Documents/apps/cob/CiPlow/pages/edit-transaction/%5Bid%5D.vue).
- **Filter Cepat:** Dropdown filter tag di riwayat transaksi untuk analisis pengeluaran berbasis label khusus.

### D. Lampiran Foto Struk Manual & Penampil Gambar Resolusi Penuh (*Receipt Viewer*)
- **Database & Penyimpanan:** Kolom `receiptImage String?` menyimpan Data URL foto struk/bukti bayar terkompresi.
- **Komponen Viewer:** [components/transactions/ReceiptModal.vue](file:///c:/Users/2080/Documents/apps/cob/CiPlow/components/transactions/ReceiptModal.vue) dengan fitur zoom, unduh berkas, dan pratinjau resolusi tinggi.
- **Integrasi UI:** Tombol lampiran kamera/file di form transaksi dan badge `🧾 Lihat Struk` di kartu daftar transaksi.

### E. Pintasan Cepat Mobile PWA (*App Shortcuts*)
- **PWA Manifest:** Konfigurasi 4 pintasan aplikasi di [nuxt.config.ts](file:///c:/Users/2080/Documents/apps/cob/CiPlow/nuxt.config.ts) (*Catat Pengeluaran*, *Catat Pemasukan*, *Scan Struk AI*, *Hutang & Piutang*) saat menahan ikon aplikasi di layar ponsel.

### F. Kartu Rekap Finansial Bulanan & Fitur Bagikan (*Shareable Monthly Recap*)
- **Komponen:** [components/analytics/MonthlyRecapCard.vue](file:///c:/Users/2080/Documents/apps/cob/CiPlow/components/analytics/MonthlyRecapCard.vue) di halaman Analitik merangkum total pemasukan, total pengeluaran, nominal tabungan bersih, rasio tabungan, kategori terbesar, dan hari aktif mencatat.
- **Fitur Bagikan:** Mendukung `navigator.share()` bawaan ponsel dan fallback salin teks otomatis ke clipboard.

### G. Filter Rentang Tanggal Cepat
- **Opsi Rentang:** Pilihan tombol filter *Bulanan*, *7 Hari Terakhir*, *30 Hari Terakhir*, dan *Rentang Kustom* dengan tanggal Mulai & Sampai di riwayat transaksi.

---

## 🛠️ 2. Catatan Rilis Versi 1.2.3 (Sebelumnya)

### A. CRUD Penuh & Kontrol Transaksi Berulang (*Recurring Transactions*)
- **Fitur Baru:** Menambahkan endpoint `PUT`, `DELETE`, dan `PATCH (toggle pause/resume)` pada `/api/recurring-transactions/`.
- **Frontend:** Antarmuka [pages/profile/recurring.vue](file:///c:/Users/2080/Documents/apps/cob/CiPlow/pages/profile/recurring.vue) kini mendukung modal Edit jadwal, hapus jadwal, jeda/aktifkan kembali jadwal tagihan, dan badge status interval yang informatif.

### B. Asisten Finansial Cerdas AI (*Gemini Financial Advisor*)
- **Fitur Baru:** Endpoint `/api/ai/advisor` memanfaatkan model `gemini-2.5-flash` untuk menganalisis arus kas nyata, rasio tabungan, pengeluaran terbesar, beban hutang, dan anggaran bulanan.
- **Frontend:** Komponen [components/analytics/AiAdvisorCard.vue](file:///c:/Users/2080/Documents/apps/cob/CiPlow/components/analytics/AiAdvisorCard.vue) di halaman Analitik dengan tombol pintas: *Evaluasi Keuangan Bulan Ini*, *Tips Pangkas Boros*, *Strategi Tabungan*, dan *Manajemen Hutang*, serta kolom tanya kustom.

### C. Mode Privasi Saldo Global (*Global Balance Masking*)
- **Penyimpanan:** State `isBalanceHidden` dikelola secara global di Pinia Store [stores/user.ts](file:///c:/Users/2080/Documents/apps/cob/CiPlow/stores/user.ts) dengan persistensi `localStorage`.
- **Integrasi:** Helper `maskBalance` di [composables/useCurrency.ts](file:///c:/Users/2080/Documents/apps/cob/CiPlow/composables/useCurrency.ts) menyensor nominal saldo serentak di kartu saldo beranda, ringkasan pemasukan/pengeluaran, riwayat transaksi, master data dompet, dan target tabungan.

### D. Pemulihan Cadangan Database Penuh (*JSON Restore*)
- **Backend:** Endpoint `/api/transactions/restore` memulihkan seluruh entitas (dompet, kategori, transaksi, anggaran, jadwal rutin, tabungan, dan hutang/piutang) dengan mapping cerdas.
- **Frontend:** Halaman [pages/profile/import.vue](file:///c:/Users/2080/Documents/apps/cob/CiPlow/pages/profile/import.vue) kini dilengkapi tab switcher *Impor Transaksi (.xlsx)* dan *Restore Cadangan (.json)* beserta ringkasan metrik pemulihan.

### E. Peningkatan Fitur Hutang & Piutang (*Debts & Loans*)
- **Histori Cicilan:** Komponen [components/debts/DebtPaymentsHistoryModal.vue](file:///c:/Users/2080/Documents/apps/cob/CiPlow/components/debts/DebtPaymentsHistoryModal.vue) menampilkan linimasa seluruh pembayaran cicilan beserta metode dompet dan catatan.
- **Pengingat WhatsApp:** Tombol penagihan cepat via WhatsApp dengan format pesan sopan otomatis di [pages/debts/index.vue](file:///c:/Users/2080/Documents/apps/cob/CiPlow/pages/debts/index.vue).

### F. Proyeksi Target Tabungan (*Savings Projection Calculator*)
- **Fitur Baru:** Menghitung estimasi waktu tercapainya impian tabungan dan besaran setoran bulanan yang direkomendasikan pada [components/savings/SavingsGoalCard.vue](file:///c:/Users/2080/Documents/apps/cob/CiPlow/components/savings/SavingsGoalCard.vue).

### G. Sistem Umpan Balik & Pelaporan Bug Interaktif
- **Database:** Model `Feedback` di Prisma schema untuk menyimpan rating bintang 1–5 dan laporan bug.
- **Frontend:** Komponen [components/ui/FeedbackModal.vue](file:///c:/Users/2080/Documents/apps/cob/CiPlow/components/ui/FeedbackModal.vue) menggantikan pesan *placeholder* pada menu profil.

---

## 🚨 3. Analisis Keamanan & Keandalan yang Telah Diterapkan

1. **Pencegahan Cross-Tenant Category Leakage**: Memfilter `where: { userId: user.id }` pada [server/api/ai/scan-receipt.post.ts](file:///c:/Users/2080/Documents/apps/cob/CiPlow/server/api/ai/scan-receipt.post.ts) agar nama kategori pengguna lain tidak bocor ke prompt AI.
2. **Validasi Kepemilikan Dompet Transaksi Berulang**: Memverifikasi kepemilikan `walletFromId` dan `walletToId` di [server/api/recurring-transactions/index.post.ts](file:///c:/Users/2080/Documents/apps/cob/CiPlow/server/api/recurring-transactions/index.post.ts) dan `[id].put.ts` untuk mencegah eksploitasi IDOR debit saldo dompet orang lain.
3. **Pencegahan Eksploitasi Saldo Penarikan Tabungan**: Memvalidasi bahwa nominal `WITHDRAW` tidak boleh melebihi `currentAmount` tabungan di [server/api/savings-goals/[id]/deposit.post.ts](file:///c:/Users/2080/Documents/apps/cob/CiPlow/server/api/savings-goals/%5Bid%5D/deposit.post.ts).
4. **Pencegahan Host Header Injection**: Memvalidasi origin domain resmi pada alur pembuatan tautan reset password di [server/api/auth/forgot-password.post.ts](file:///c:/Users/2080/Documents/apps/cob/CiPlow/server/api/auth/forgot-password.post.ts).
5. **Perbaikan Date Overflow Cron Transaksi Bulanan**: Algoritma `advanceRecurringDate` di [server/api/cron/process-recurring.post.ts](file:///c:/Users/2080/Documents/apps/cob/CiPlow/server/api/cron/process-recurring.post.ts) mencegah tanggal 31 melompat ke bulan berikutnya secara permanen.
6. **Integritas Nilai Hutang & Piutang**: Mencegah sisa tagihan negatif saat mengedit `totalAmount` atau memasukkan `initialPaid` di [server/api/debts/](file:///c:/Users/2080/Documents/apps/cob/CiPlow/server/api/debts/).
7. **Pengecekan Saldo Atomic di Database Transaction**: Mencegah *race condition (TOCTOU)* saldo minus saat request mutasi dikirim simultan di [server/api/transactions/index.post.ts](file:///c:/Users/2080/Documents/apps/cob/CiPlow/server/api/transactions/index.post.ts).
8. **Pembatasan Ukuran File Unggahan (DoS Protection)**: Membatasi ukuran file maksimal (5MB–10MB) pada endpoint impor Excel, restore JSON, foto struk AI, dan lampiran struk manual.
9. **Pembersihan Otomatis Sesi Kedaluwarsa**: Cron worker memanggil `cleanupExpiredSessions()` secara berkala.
10. **Rate Limiting Komprehensif**: Pembatasan frekuensi request pada endpoint autentikasi, AI scanner, AI advisor, dan feedback.

---

## 🚀 4. Roadmap & Rencana Pengembangan Masa Depan (v1.3.0+)

### 📌 Telah Selesai di v1.2.4
- [x] Tema Warna Kustom (Emerald, Ocean, Violet, Amber, Rose).
- [x] Kalender Finansial Interaktif & View Switcher.
- [x] Sistem Label / Tag Transaksi (#tags).
- [x] Lampiran Foto Struk Manual & Viewer Resolusi Penuh.
- [x] Pintasan Cepat Mobile PWA (App Shortcuts).
- [x] Kartu Rekap Finansial Bulanan & Fitur Bagikan.
- [x] Filter Rentang Tanggal Cepat (7 Hari, 30 Hari, Kustom).

### 📌 Rencana v1.3.0
- [ ] **Buku Kas Bersama / Multi-User Budget (Shared Family Budget)**: Kolaborasi pencatatan keuangan bersama pasangan atau anggota keluarga dengan hak akses peran (Owner, Editor, Viewer).
- [ ] **Grafik Heatmap Pengeluaran Tahunan (GitHub-style Contribution Grid)**: Visualisasi intensitas pengeluaran 365 hari dalam setahun.
- [ ] **Integrasi Web Push Notification**: Notifikasi tagihan jatuh tempo dan peringatan batas anggaran langsung ke browser/device tanpa membuka aplikasi.

---

*Dokumen ini diperbarui secara berkala sebagai panduan teknis dan pengembangan proyek CashPlow.*
