# 📋 Dokumen Analisis & Rencana Pembaruan CashPlow (CiPlow)

Dokumen ini memuat catatan perbaikan terbaru, analisis celah bug & keamanan, bagian yang dapat dioptimalkan/disederhanakan, serta peta jalan (*roadmap*) pengembangan fitur aplikasi **CashPlow Budget Tracker**.

---

## 🛠️ 1. Catatan Perbaikan & Fitur Terbaru (Rilis Versi 1.2.3)

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

### H. Penampil Catatan Rilis (*In-App Changelog Viewer*)
- **Frontend:** Halaman [pages/profile/about.vue](file:///c:/Users/2080/Documents/apps/cob/CiPlow/pages/profile/about.vue) menampilkan versi 1.2.3 dan tab riwayat rilis interaktif.

---

## 🚨 2. Analisis Keamanan & Keandalan yang Telah Diterapkan

1. **Pencegahan Cross-Tenant Category Leakage**: Memfilter `where: { userId: user.id }` pada [server/api/ai/scan-receipt.post.ts](file:///c:/Users/2080/Documents/apps/cob/CiPlow/server/api/ai/scan-receipt.post.ts) agar nama kategori pengguna lain tidak bocor ke prompt AI.
2. **Validasi Kepemilikan Dompet Transaksi Berulang**: Memverifikasi kepemilikan `walletFromId` dan `walletToId` di [server/api/recurring-transactions/index.post.ts](file:///c:/Users/2080/Documents/apps/cob/CiPlow/server/api/recurring-transactions/index.post.ts) dan `[id].put.ts` untuk mencegah eksploitasi IDOR debit saldo dompet orang lain.
3. **Pencegahan Eksploitasi Saldo Penarikan Tabungan**: Memvalidasi bahwa nominal `WITHDRAW` tidak boleh melebihi `currentAmount` tabungan di [server/api/savings-goals/[id]/deposit.post.ts](file:///c:/Users/2080/Documents/apps/cob/CiPlow/server/api/savings-goals/%5Bid%5D/deposit.post.ts).
4. **Pencegahan Host Header Injection**: Memvalidasi origin domain resmi pada alur pembuatan tautan reset password di [server/api/auth/forgot-password.post.ts](file:///c:/Users/2080/Documents/apps/cob/CiPlow/server/api/auth/forgot-password.post.ts).
5. **Perbaikan Date Overflow Cron Transaksi Bulanan**: Algoritma `advanceRecurringDate` di [server/api/cron/process-recurring.post.ts](file:///c:/Users/2080/Documents/apps/cob/CiPlow/server/api/cron/process-recurring.post.ts) mencegah tanggal 31 melompat ke bulan berikutnya secara permanen.
6. **Integritas Nilai Hutang & Piutang**: Mencegah sisa tagihan negatif saat mengedit `totalAmount` atau memasukkan `initialPaid` di [server/api/debts/](file:///c:/Users/2080/Documents/apps/cob/CiPlow/server/api/debts/).
7. **Pengecekan Saldo Atomic di Database Transaction**: Mencegah *race condition (TOCTOU)* saldo minus saat request mutasi dikirim simultan di [server/api/transactions/index.post.ts](file:///c:/Users/2080/Documents/apps/cob/CiPlow/server/api/transactions/index.post.ts).
8. **Pembatasan Ukuran File Unggahan (DoS Protection)**: Membatasi ukuran file maksimal (5MB–10MB) pada endpoint impor Excel, restore JSON, dan foto struk AI.
9. **Pembersihan Otomatis Sesi Kedaluwarsa**: Cron worker memanggil `cleanupExpiredSessions()` secara berkala.
10. **Rate Limiting Komprehensif**: Pembatasan frekuensi request pada endpoint autentikasi, AI scanner, AI advisor, dan feedback.

---

## 🚀 3. Roadmap & Rencana Pengembangan Masa Depan (v1.3.0+)

### 📌 Fase 4 (Selesai di v1.2.3)
- [x] CRUD Transaksi Berulang & Kontrol Pause/Resume.
- [x] Asisten Finansial Pintar AI (Gemini Pro).
- [x] Mode Privasi Saldo Global.
- [x] Pemulihan Cadangan Penuh (JSON Restore).
- [x] WhatsApp Reminder & Riwayat Cicilan Hutang/Piutang.
- [x] Proyeksi Target Tabungan.
- [x] Modal Umpan Balik / Lapor Bug.
- [x] Versi 1.2.3 & In-App Changelog Viewer.

### 📌 Fase 5 (Rencana v1.3.0)
- [ ] **Buku Kas Bersama / Multi-User Budget (Shared Family Budget)**: Kolaborasi pencatatan keuangan bersama pasangan atau anggota keluarga.
- [ ] **Kustomisasi Tema Aksen Warna**: Pilihan tema warna aksen selain Emerald (Royal Blue, Violet, Amber, Rose).
- [ ] **Widget iOS / Android PWA Shortcuts**: Aksi cepat catat pengeluaran langsung dari home screen.

---

*Dokumen ini diperbarui secara berkala sebagai panduan teknis dan pengembangan proyek CashPlow.*
