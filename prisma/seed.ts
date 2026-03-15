import {
  PrismaClient,
  WalletType,
  TransactionType,
  CategoryType,
} from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

// ─── Date helpers ──────────────────────────────────────────────
const now = new Date();
const cy = now.getFullYear();
const cm = now.getMonth(); // 0-indexed

/**
 * Build a Date for `day` of the month, offset by `monthsBack` months.
 * hour defaults to 09:00 to keep things tidy.
 */
const D = (day: number, monthsBack = 0, hour = 9, min = 0): Date =>
  new Date(cy, cm - monthsBack, day, hour, min, 0, 0);

/** Random int between lo and hi (inclusive) */
const rnd = (lo: number, hi: number) =>
  Math.floor(Math.random() * (hi - lo + 1)) + lo;

// ─── Main ──────────────────────────────────────────────────────
async function main() {
  console.log("\n🗑️  Clearing existing data…");
  // Delete in FK-safe order
  await prisma.budget.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.category.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  // ── 1. USER ────────────────────────────────────────────────
  console.log("👤  Creating user…");
  const hashedPassword = await bcrypt.hash("password123", 12);
  const user = await prisma.user.create({
    data: {
      name: "Budi Santoso",
      email: "budi@pplow.app",
      password: hashedPassword,
      currency: "IDR",
      locale: "id-ID",
    },
  });
  const uid = user.id;

  // ── 2. WALLETS ─────────────────────────────────────────────
  console.log("👛  Creating wallets…");
  const [bca, cash, gopay, ovo] = await Promise.all([
    prisma.wallet.create({
      data: {
        userId: uid,
        name: "Bank BCA",
        type: WalletType.BANK,
        balance: 18_500_000,
        color: "#3b82f6",
        icon: "🏦",
        isDefault: true,
        description: "Rekening utama BCA Tabungan",
      },
    }),
    prisma.wallet.create({
      data: {
        userId: uid,
        name: "Kas Tunai",
        type: WalletType.CASH,
        balance: 1_350_000,
        color: "#10b981",
        icon: "💵",
        isDefault: false,
        description: "Uang tunai di dompet",
      },
    }),
    prisma.wallet.create({
      data: {
        userId: uid,
        name: "GoPay",
        type: WalletType.E_WALLET,
        balance: 3_200_000,
        color: "#00aed6",
        icon: "💙",
        isDefault: false,
        description: "GoPay untuk transaksi sehari-hari",
      },
    }),
    prisma.wallet.create({
      data: {
        userId: uid,
        name: "OVO",
        type: WalletType.E_WALLET,
        balance: 1_800_000,
        color: "#4c1d95",
        icon: "💜",
        isDefault: false,
        description: "OVO untuk belanja online",
      },
    }),
  ]);

  // ── 3. CATEGORIES ──────────────────────────────────────────
  console.log("🏷️  Creating categories…");

  // Income
  const [catGaji, catFreelance, catBisnis, catInvestasi, catBonus, catLainInc] =
    await Promise.all([
      prisma.category.create({
        data: {
          userId: uid,
          name: "Gaji & Upah",
          type: CategoryType.INCOME,
          color: "#10b981",
          icon: "💼",
          isDefault: true,
        },
      }),
      prisma.category.create({
        data: {
          userId: uid,
          name: "Freelance",
          type: CategoryType.INCOME,
          color: "#3b82f6",
          icon: "💻",
          isDefault: true,
        },
      }),
      prisma.category.create({
        data: {
          userId: uid,
          name: "Bisnis",
          type: CategoryType.INCOME,
          color: "#8b5cf6",
          icon: "🏪",
          isDefault: false,
        },
      }),
      prisma.category.create({
        data: {
          userId: uid,
          name: "Hasil Investasi",
          type: CategoryType.INCOME,
          color: "#f59e0b",
          icon: "📈",
          isDefault: false,
        },
      }),
      prisma.category.create({
        data: {
          userId: uid,
          name: "Hadiah & Bonus",
          type: CategoryType.INCOME,
          color: "#ec4899",
          icon: "🎁",
          isDefault: false,
        },
      }),
      prisma.category.create({
        data: {
          userId: uid,
          name: "Lainnya",
          type: CategoryType.INCOME,
          color: "#6b7280",
          icon: "📦",
          isDefault: false,
        },
      }),
    ]);

  // Expense
  const [
    catMakan,
    catTransport,
    catTagihan,
    catHiburan,
    catBelanja,
    catKesehatan,
    catPendidikan,
    catSosial,
    catPerawatan,
    catRumah,
    catLainExp,
  ] = await Promise.all([
    prisma.category.create({
      data: {
        userId: uid,
        name: "Makanan & Minuman",
        type: CategoryType.EXPENSE,
        color: "#10b981",
        icon: "🍔",
        isDefault: true,
      },
    }),
    prisma.category.create({
      data: {
        userId: uid,
        name: "Transportasi",
        type: CategoryType.EXPENSE,
        color: "#3b82f6",
        icon: "🚗",
        isDefault: true,
      },
    }),
    prisma.category.create({
      data: {
        userId: uid,
        name: "Tagihan & Utilitas",
        type: CategoryType.EXPENSE,
        color: "#f59e0b",
        icon: "💡",
        isDefault: true,
      },
    }),
    prisma.category.create({
      data: {
        userId: uid,
        name: "Hiburan",
        type: CategoryType.EXPENSE,
        color: "#8b5cf6",
        icon: "🎮",
        isDefault: true,
      },
    }),
    prisma.category.create({
      data: {
        userId: uid,
        name: "Belanja",
        type: CategoryType.EXPENSE,
        color: "#ec4899",
        icon: "🛍️",
        isDefault: true,
      },
    }),
    prisma.category.create({
      data: {
        userId: uid,
        name: "Kesehatan",
        type: CategoryType.EXPENSE,
        color: "#ef4444",
        icon: "🏥",
        isDefault: true,
      },
    }),
    prisma.category.create({
      data: {
        userId: uid,
        name: "Pendidikan",
        type: CategoryType.EXPENSE,
        color: "#0ea5e9",
        icon: "📚",
        isDefault: false,
      },
    }),
    prisma.category.create({
      data: {
        userId: uid,
        name: "Sosial & Hadiah",
        type: CategoryType.EXPENSE,
        color: "#14b8a6",
        icon: "🤝",
        isDefault: false,
      },
    }),
    prisma.category.create({
      data: {
        userId: uid,
        name: "Perawatan Diri",
        type: CategoryType.EXPENSE,
        color: "#a855f7",
        icon: "💆",
        isDefault: false,
      },
    }),
    prisma.category.create({
      data: {
        userId: uid,
        name: "Rumah & Perabotan",
        type: CategoryType.EXPENSE,
        color: "#84cc16",
        icon: "🏠",
        isDefault: false,
      },
    }),
    prisma.category.create({
      data: {
        userId: uid,
        name: "Lainnya",
        type: CategoryType.EXPENSE,
        color: "#6b7280",
        icon: "📦",
        isDefault: false,
      },
    }),
  ]);

  // ── 4. TRANSACTIONS ────────────────────────────────────────
  console.log("💸  Creating transactions (3 months)…");

  type TxInput = {
    description: string;
    notes?: string;
    type: TransactionType;
    amount: number;
    categoryId: string;
    walletFromId?: string;
    walletToId?: string;
    date: Date;
  };

  const txRows: TxInput[] = [
    // ══════════════════════════════════════════════════════════
    // BULAN INI  (monthsBack = 0)
    // ══════════════════════════════════════════════════════════

    // ── Income
    {
      description: "Gaji Bulan Ini",
      notes: "Transfer dari PT. Maju Bersama",
      type: TransactionType.INCOME,
      amount: 15_500_000,
      categoryId: catGaji.id,
      walletToId: bca.id,
      date: D(1, 0, 8, 0),
    },
    {
      description: "Project Freelance — Website Toko Online",
      notes: "Klien: CV Berkah Jaya",
      type: TransactionType.INCOME,
      amount: 3_500_000,
      categoryId: catFreelance.id,
      walletToId: gopay.id,
      date: D(5, 0, 14, 30),
    },

    // ── Makanan & Minuman
    {
      description: "Belanja Groceries",
      notes: "Superindo Kelapa Gading",
      type: TransactionType.EXPENSE,
      amount: 285_000,
      categoryId: catMakan.id,
      walletFromId: gopay.id,
      date: D(2, 0, 10, 15),
    },
    {
      description: "Makan Siang — Warteg Pak Slamet",
      type: TransactionType.EXPENSE,
      amount: 28_000,
      categoryId: catMakan.id,
      walletFromId: cash.id,
      date: D(3, 0, 12, 30),
    },
    {
      description: "GoFood — Ayam Geprek",
      type: TransactionType.EXPENSE,
      amount: 45_000,
      categoryId: catMakan.id,
      walletFromId: gopay.id,
      date: D(5, 0, 19, 0),
    },
    {
      description: "Kopi & Snack — Kopi Kenangan",
      type: TransactionType.EXPENSE,
      amount: 52_000,
      categoryId: catMakan.id,
      walletFromId: gopay.id,
      date: D(7, 0, 9, 0),
    },
    {
      description: "Makan Siang — Nasi Padang",
      type: TransactionType.EXPENSE,
      amount: 32_000,
      categoryId: catMakan.id,
      walletFromId: cash.id,
      date: D(8, 0, 12, 0),
    },
    {
      description: "Belanja Mingguan — Giant",
      notes: "Sayur, buah & kebutuhan dapur",
      type: TransactionType.EXPENSE,
      amount: 320_000,
      categoryId: catMakan.id,
      walletFromId: gopay.id,
      date: D(9, 0, 10, 30),
    },
    {
      description: "GoFood — Pizza Delivery",
      type: TransactionType.EXPENSE,
      amount: 120_000,
      categoryId: catMakan.id,
      walletFromId: ovo.id,
      date: D(11, 0, 20, 0),
    },
    {
      description: "Kopi Susu Kekinian",
      type: TransactionType.EXPENSE,
      amount: 38_000,
      categoryId: catMakan.id,
      walletFromId: gopay.id,
      date: D(12, 0, 8, 30),
    },
    {
      description: "Makan Siang Kantor",
      type: TransactionType.EXPENSE,
      amount: 35_000,
      categoryId: catMakan.id,
      walletFromId: cash.id,
      date: D(13, 0, 12, 45),
    },

    // ── Transportasi
    {
      description: "Bensin Pertamax",
      notes: "SPBU Pertamina Kelapa Gading",
      type: TransactionType.EXPENSE,
      amount: 150_000,
      categoryId: catTransport.id,
      walletFromId: cash.id,
      date: D(2, 0, 7, 30),
    },
    {
      description: "Grab — Kantor ke Mal",
      type: TransactionType.EXPENSE,
      amount: 28_000,
      categoryId: catTransport.id,
      walletFromId: ovo.id,
      date: D(6, 0, 18, 15),
    },
    {
      description: "Parkir Mal",
      type: TransactionType.EXPENSE,
      amount: 10_000,
      categoryId: catTransport.id,
      walletFromId: cash.id,
      date: D(6, 0, 18, 0),
    },
    {
      description: "Bensin Pertamax",
      type: TransactionType.EXPENSE,
      amount: 120_000,
      categoryId: catTransport.id,
      walletFromId: cash.id,
      date: D(10, 0, 7, 0),
    },
    {
      description: "GoJek — Pulang Kerja",
      type: TransactionType.EXPENSE,
      amount: 22_000,
      categoryId: catTransport.id,
      walletFromId: gopay.id,
      date: D(13, 0, 18, 30),
    },

    // ── Tagihan & Utilitas
    {
      description: "Listrik PLN",
      notes: "Token listrik 200 kWh",
      type: TransactionType.EXPENSE,
      amount: 425_000,
      categoryId: catTagihan.id,
      walletFromId: bca.id,
      date: D(3, 0, 9, 0),
    },
    {
      description: "Internet IndiHome",
      notes: "Tagihan bulanan 30 Mbps",
      type: TransactionType.EXPENSE,
      amount: 350_000,
      categoryId: catTagihan.id,
      walletFromId: bca.id,
      date: D(4, 0, 10, 0),
    },
    {
      description: "Air PDAM",
      type: TransactionType.EXPENSE,
      amount: 85_000,
      categoryId: catTagihan.id,
      walletFromId: bca.id,
      date: D(5, 0, 9, 30),
    },
    {
      description: "Pulsa & Paket Data",
      notes: "Telkomsel 40GB/30 hari",
      type: TransactionType.EXPENSE,
      amount: 120_000,
      categoryId: catTagihan.id,
      walletFromId: gopay.id,
      date: D(7, 0, 11, 0),
    },

    // ── Hiburan
    {
      description: "Netflix + Spotify",
      notes: "Langganan streaming bulanan",
      type: TransactionType.EXPENSE,
      amount: 109_000,
      categoryId: catHiburan.id,
      walletFromId: ovo.id,
      date: D(3, 0, 12, 0),
    },
    {
      description: "Bioskop — XXI",
      notes: "2 tiket film terbaru",
      type: TransactionType.EXPENSE,
      amount: 120_000,
      categoryId: catHiburan.id,
      walletFromId: gopay.id,
      date: D(8, 0, 19, 30),
    },
    {
      description: "Game Top-Up Mobile Legend",
      type: TransactionType.EXPENSE,
      amount: 50_000,
      categoryId: catHiburan.id,
      walletFromId: ovo.id,
      date: D(11, 0, 21, 0),
    },

    // ── Belanja
    {
      description: "Baju Kerja — H&M",
      notes: "2 pcs kemeja formal",
      type: TransactionType.EXPENSE,
      amount: 459_000,
      categoryId: catBelanja.id,
      walletFromId: bca.id,
      date: D(6, 0, 16, 0),
    },
    {
      description: "Sepatu Casual — Tokopedia",
      notes: "Nike Air Max",
      type: TransactionType.EXPENSE,
      amount: 650_000,
      categoryId: catBelanja.id,
      walletFromId: ovo.id,
      date: D(9, 0, 10, 0),
    },

    // ── Kesehatan
    {
      description: "Iuran Gym Bulanan",
      notes: "FitPlus Gym Kelapa Gading",
      type: TransactionType.EXPENSE,
      amount: 300_000,
      categoryId: catKesehatan.id,
      walletFromId: bca.id,
      date: D(1, 0, 8, 30),
    },
    {
      description: "Vitamin & Suplemen",
      notes: "Guardian — Vit C, Zinc, Omega 3",
      type: TransactionType.EXPENSE,
      amount: 175_000,
      categoryId: catKesehatan.id,
      walletFromId: gopay.id,
      date: D(4, 0, 12, 0),
    },

    // ── Sosial
    {
      description: "Makan Bersama Teman",
      notes: "Restoran Sushi Tei",
      type: TransactionType.EXPENSE,
      amount: 280_000,
      categoryId: catSosial.id,
      walletFromId: gopay.id,
      date: D(10, 0, 19, 0),
    },

    // ══════════════════════════════════════════════════════════
    // BULAN LALU  (monthsBack = 1)
    // ══════════════════════════════════════════════════════════

    // ── Income
    {
      description: "Gaji Bulan Lalu",
      notes: "Transfer dari PT. Maju Bersama",
      type: TransactionType.INCOME,
      amount: 15_500_000,
      categoryId: catGaji.id,
      walletToId: bca.id,
      date: D(1, 1, 8, 0),
    },
    {
      description: "Dividen Saham Reksadana",
      type: TransactionType.INCOME,
      amount: 850_000,
      categoryId: catInvestasi.id,
      walletToId: bca.id,
      date: D(15, 1, 10, 0),
    },
    {
      description: "Bonus Kinerja Tahunan",
      notes: "Bonus Q4 tahun sebelumnya",
      type: TransactionType.INCOME,
      amount: 5_000_000,
      categoryId: catBonus.id,
      walletToId: bca.id,
      date: D(10, 1, 9, 0),
    },

    // ── Makanan & Minuman (last month)
    {
      description: "Belanja Groceries",
      notes: "Ranch Market",
      type: TransactionType.EXPENSE,
      amount: 340_000,
      categoryId: catMakan.id,
      walletFromId: gopay.id,
      date: D(2, 1, 10, 0),
    },
    {
      description: "GoFood — Soto Ayam",
      type: TransactionType.EXPENSE,
      amount: 38_000,
      categoryId: catMakan.id,
      walletFromId: gopay.id,
      date: D(3, 1, 12, 30),
    },
    {
      description: "Makan Siang Kantor",
      type: TransactionType.EXPENSE,
      amount: 28_000,
      categoryId: catMakan.id,
      walletFromId: cash.id,
      date: D(5, 1, 12, 0),
    },
    {
      description: "Belanja Mingguan",
      notes: "Indomaret + Alfamart",
      type: TransactionType.EXPENSE,
      amount: 195_000,
      categoryId: catMakan.id,
      walletFromId: gopay.id,
      date: D(8, 1, 9, 30),
    },
    {
      description: "Kopi & Sarapan — Fore Coffee",
      type: TransactionType.EXPENSE,
      amount: 62_000,
      categoryId: catMakan.id,
      walletFromId: gopay.id,
      date: D(10, 1, 8, 0),
    },
    {
      description: "Makan Malam — Penyetan",
      type: TransactionType.EXPENSE,
      amount: 42_000,
      categoryId: catMakan.id,
      walletFromId: cash.id,
      date: D(14, 1, 18, 30),
    },
    {
      description: "Belanja Groceries Minggu Ke-3",
      type: TransactionType.EXPENSE,
      amount: 280_000,
      categoryId: catMakan.id,
      walletFromId: gopay.id,
      date: D(18, 1, 11, 0),
    },
    {
      description: "Delivery — KFC Family Pack",
      type: TransactionType.EXPENSE,
      amount: 145_000,
      categoryId: catMakan.id,
      walletFromId: gopay.id,
      date: D(22, 1, 19, 0),
    },
    {
      description: "Belanja Groceries Akhir Bulan",
      type: TransactionType.EXPENSE,
      amount: 260_000,
      categoryId: catMakan.id,
      walletFromId: gopay.id,
      date: D(26, 1, 10, 0),
    },
    {
      description: "Makan Siang + Kopi",
      type: TransactionType.EXPENSE,
      amount: 58_000,
      categoryId: catMakan.id,
      walletFromId: cash.id,
      date: D(28, 1, 13, 0),
    },

    // ── Transportasi (last month)
    {
      description: "Bensin Full Tank",
      type: TransactionType.EXPENSE,
      amount: 200_000,
      categoryId: catTransport.id,
      walletFromId: cash.id,
      date: D(2, 1, 7, 30),
    },
    {
      description: "Parkir Bulanan Kantor",
      type: TransactionType.EXPENSE,
      amount: 250_000,
      categoryId: catTransport.id,
      walletFromId: bca.id,
      date: D(1, 1, 8, 0),
    },
    {
      description: "GoJek Perjalanan Dinas",
      type: TransactionType.EXPENSE,
      amount: 85_000,
      categoryId: catTransport.id,
      walletFromId: gopay.id,
      date: D(11, 1, 16, 0),
    },
    {
      description: "Bensin Isi Ulang",
      type: TransactionType.EXPENSE,
      amount: 150_000,
      categoryId: catTransport.id,
      walletFromId: cash.id,
      date: D(17, 1, 7, 0),
    },
    {
      description: "Grab — Airport",
      notes: "Perjalanan ke Soeta",
      type: TransactionType.EXPENSE,
      amount: 180_000,
      categoryId: catTransport.id,
      walletFromId: ovo.id,
      date: D(23, 1, 5, 30),
    },
    {
      description: "Bensin Akhir Bulan",
      type: TransactionType.EXPENSE,
      amount: 130_000,
      categoryId: catTransport.id,
      walletFromId: cash.id,
      date: D(28, 1, 7, 0),
    },

    // ── Tagihan (last month)
    {
      description: "Listrik PLN",
      type: TransactionType.EXPENSE,
      amount: 410_000,
      categoryId: catTagihan.id,
      walletFromId: bca.id,
      date: D(3, 1, 9, 0),
    },
    {
      description: "Internet IndiHome",
      type: TransactionType.EXPENSE,
      amount: 350_000,
      categoryId: catTagihan.id,
      walletFromId: bca.id,
      date: D(4, 1, 9, 0),
    },
    {
      description: "Air PDAM",
      type: TransactionType.EXPENSE,
      amount: 78_000,
      categoryId: catTagihan.id,
      walletFromId: bca.id,
      date: D(5, 1, 9, 0),
    },
    {
      description: "Pulsa & Paket Data",
      type: TransactionType.EXPENSE,
      amount: 120_000,
      categoryId: catTagihan.id,
      walletFromId: gopay.id,
      date: D(7, 1, 10, 0),
    },

    // ── Hiburan (last month)
    {
      description: "Netflix + Spotify",
      type: TransactionType.EXPENSE,
      amount: 109_000,
      categoryId: catHiburan.id,
      walletFromId: ovo.id,
      date: D(3, 1, 12, 0),
    },
    {
      description: "Disney+ Hotstar",
      type: TransactionType.EXPENSE,
      amount: 49_000,
      categoryId: catHiburan.id,
      walletFromId: ovo.id,
      date: D(5, 1, 12, 0),
    },
    {
      description: "Bioskop — 2 Tiket",
      type: TransactionType.EXPENSE,
      amount: 120_000,
      categoryId: catHiburan.id,
      walletFromId: gopay.id,
      date: D(14, 1, 19, 0),
    },
    {
      description: "Karaoke — Inul Vizta",
      notes: "Nyanyi bareng 4 orang",
      type: TransactionType.EXPENSE,
      amount: 250_000,
      categoryId: catHiburan.id,
      walletFromId: cash.id,
      date: D(21, 1, 20, 0),
    },

    // ── Belanja (last month)
    {
      description: "Seprai & Bantal — IKEA",
      type: TransactionType.EXPENSE,
      amount: 580_000,
      categoryId: catBelanja.id,
      walletFromId: bca.id,
      date: D(13, 1, 14, 0),
    },
    {
      description: "Skincare — The Body Shop",
      type: TransactionType.EXPENSE,
      amount: 350_000,
      categoryId: catBelanja.id,
      walletFromId: ovo.id,
      date: D(20, 1, 13, 0),
    },

    // ── Kesehatan (last month)
    {
      description: "Iuran Gym",
      type: TransactionType.EXPENSE,
      amount: 300_000,
      categoryId: catKesehatan.id,
      walletFromId: bca.id,
      date: D(1, 1, 8, 0),
    },
    {
      description: "Konsultasi Dokter",
      notes: "Puskesmas Kelapa Gading",
      type: TransactionType.EXPENSE,
      amount: 55_000,
      categoryId: catKesehatan.id,
      walletFromId: gopay.id,
      date: D(16, 1, 10, 0),
    },
    {
      description: "Apotek — Obat & Vitamin",
      type: TransactionType.EXPENSE,
      amount: 128_000,
      categoryId: catKesehatan.id,
      walletFromId: gopay.id,
      date: D(16, 1, 11, 0),
    },

    // ── Sosial (last month)
    {
      description: "Arisan Keluarga",
      type: TransactionType.EXPENSE,
      amount: 500_000,
      categoryId: catSosial.id,
      walletFromId: cash.id,
      date: D(12, 1, 15, 0),
    },
    {
      description: "Kado Ulang Tahun Teman",
      type: TransactionType.EXPENSE,
      amount: 250_000,
      categoryId: catSosial.id,
      walletFromId: gopay.id,
      date: D(19, 1, 12, 0),
    },

    // ══════════════════════════════════════════════════════════
    // DUA BULAN LALU  (monthsBack = 2)
    // ══════════════════════════════════════════════════════════

    // ── Income
    {
      description: "Gaji Dua Bulan Lalu",
      notes: "Transfer dari PT. Maju Bersama",
      type: TransactionType.INCOME,
      amount: 15_500_000,
      categoryId: catGaji.id,
      walletToId: bca.id,
      date: D(1, 2, 8, 0),
    },
    {
      description: "Freelance — Desain Logo",
      notes: "Klien: Startup Teknologi",
      type: TransactionType.INCOME,
      amount: 1_200_000,
      categoryId: catFreelance.id,
      walletToId: gopay.id,
      date: D(20, 2, 15, 0),
    },

    // ── Makanan & Minuman (2 months ago)
    {
      description: "Belanja Groceries",
      notes: "Hypermart Kelapa Gading",
      type: TransactionType.EXPENSE,
      amount: 312_000,
      categoryId: catMakan.id,
      walletFromId: gopay.id,
      date: D(2, 2, 10, 0),
    },
    {
      description: "GoFood — Mie Ayam Bakso",
      type: TransactionType.EXPENSE,
      amount: 35_000,
      categoryId: catMakan.id,
      walletFromId: gopay.id,
      date: D(4, 2, 12, 30),
    },
    {
      description: "Makan Siang Kantor",
      type: TransactionType.EXPENSE,
      amount: 30_000,
      categoryId: catMakan.id,
      walletFromId: cash.id,
      date: D(6, 2, 12, 0),
    },
    {
      description: "Kopi & Roti — BreadTalk",
      type: TransactionType.EXPENSE,
      amount: 55_000,
      categoryId: catMakan.id,
      walletFromId: gopay.id,
      date: D(9, 2, 8, 30),
    },
    {
      description: "Belanja Mingguan",
      type: TransactionType.EXPENSE,
      amount: 225_000,
      categoryId: catMakan.id,
      walletFromId: gopay.id,
      date: D(11, 2, 10, 0),
    },
    {
      description: "Makan Malam — Seafood",
      notes: "Warung Seafood Bu Sari",
      type: TransactionType.EXPENSE,
      amount: 185_000,
      categoryId: catMakan.id,
      walletFromId: cash.id,
      date: D(15, 2, 19, 0),
    },
    {
      description: "Delivery — McD Family",
      type: TransactionType.EXPENSE,
      amount: 165_000,
      categoryId: catMakan.id,
      walletFromId: gopay.id,
      date: D(18, 2, 19, 30),
    },
    {
      description: "Belanja Groceries Akhir Bulan",
      type: TransactionType.EXPENSE,
      amount: 290_000,
      categoryId: catMakan.id,
      walletFromId: gopay.id,
      date: D(24, 2, 10, 0),
    },
    {
      description: "Makan Siang + Minuman",
      type: TransactionType.EXPENSE,
      amount: 48_000,
      categoryId: catMakan.id,
      walletFromId: cash.id,
      date: D(27, 2, 13, 0),
    },

    // ── Transportasi (2 months ago)
    {
      description: "Bensin Full Tank",
      type: TransactionType.EXPENSE,
      amount: 180_000,
      categoryId: catTransport.id,
      walletFromId: cash.id,
      date: D(1, 2, 7, 0),
    },
    {
      description: "Parkir Bulanan Kantor",
      type: TransactionType.EXPENSE,
      amount: 250_000,
      categoryId: catTransport.id,
      walletFromId: bca.id,
      date: D(1, 2, 8, 0),
    },
    {
      description: "GoJek — Hujan Deras",
      type: TransactionType.EXPENSE,
      amount: 32_000,
      categoryId: catTransport.id,
      walletFromId: gopay.id,
      date: D(8, 2, 17, 30),
    },
    {
      description: "Bensin Isi Ulang",
      type: TransactionType.EXPENSE,
      amount: 140_000,
      categoryId: catTransport.id,
      walletFromId: cash.id,
      date: D(15, 2, 7, 0),
    },
    {
      description: "Grab — Perjalanan Antar Kota",
      type: TransactionType.EXPENSE,
      amount: 95_000,
      categoryId: catTransport.id,
      walletFromId: ovo.id,
      date: D(22, 2, 14, 0),
    },

    // ── Tagihan (2 months ago)
    {
      description: "Listrik PLN",
      type: TransactionType.EXPENSE,
      amount: 390_000,
      categoryId: catTagihan.id,
      walletFromId: bca.id,
      date: D(3, 2, 9, 0),
    },
    {
      description: "Internet IndiHome",
      type: TransactionType.EXPENSE,
      amount: 350_000,
      categoryId: catTagihan.id,
      walletFromId: bca.id,
      date: D(4, 2, 9, 0),
    },
    {
      description: "Air PDAM",
      type: TransactionType.EXPENSE,
      amount: 72_000,
      categoryId: catTagihan.id,
      walletFromId: bca.id,
      date: D(5, 2, 9, 0),
    },
    {
      description: "Pulsa & Paket Data",
      type: TransactionType.EXPENSE,
      amount: 120_000,
      categoryId: catTagihan.id,
      walletFromId: gopay.id,
      date: D(7, 2, 10, 0),
    },
    {
      description: "Gas LPG 12kg",
      type: TransactionType.EXPENSE,
      amount: 210_000,
      categoryId: catTagihan.id,
      walletFromId: cash.id,
      date: D(13, 2, 10, 0),
    },

    // ── Hiburan (2 months ago)
    {
      description: "Netflix + Spotify",
      type: TransactionType.EXPENSE,
      amount: 109_000,
      categoryId: catHiburan.id,
      walletFromId: ovo.id,
      date: D(3, 2, 12, 0),
    },
    {
      description: "Bioskop — 2 Tiket",
      type: TransactionType.EXPENSE,
      amount: 100_000,
      categoryId: catHiburan.id,
      walletFromId: gopay.id,
      date: D(10, 2, 19, 0),
    },
    {
      description: "Nintendo Game Purchase",
      notes: "Zelda DLC",
      type: TransactionType.EXPENSE,
      amount: 120_000,
      categoryId: catHiburan.id,
      walletFromId: ovo.id,
      date: D(17, 2, 20, 0),
    },

    // ── Belanja (2 months ago)
    {
      description: "Celana Jeans — Uniqlo",
      type: TransactionType.EXPENSE,
      amount: 399_000,
      categoryId: catBelanja.id,
      walletFromId: ovo.id,
      date: D(9, 2, 14, 0),
    },
    {
      description: "Peralatan Dapur — Lazada",
      type: TransactionType.EXPENSE,
      amount: 285_000,
      categoryId: catBelanja.id,
      walletFromId: bca.id,
      date: D(16, 2, 11, 0),
    },

    // ── Kesehatan (2 months ago)
    {
      description: "Iuran Gym",
      type: TransactionType.EXPENSE,
      amount: 300_000,
      categoryId: catKesehatan.id,
      walletFromId: bca.id,
      date: D(1, 2, 8, 0),
    },
    {
      description: "Medical Check-Up Tahunan",
      notes: "Klinik Siloam",
      type: TransactionType.EXPENSE,
      amount: 450_000,
      categoryId: catKesehatan.id,
      walletFromId: bca.id,
      date: D(14, 2, 9, 0),
    },

    // ── Sosial (2 months ago)
    {
      description: "Makan Malam Reuni SMA",
      type: TransactionType.EXPENSE,
      amount: 320_000,
      categoryId: catSosial.id,
      walletFromId: cash.id,
      date: D(20, 2, 19, 0),
    },

    // ── Rumah (2 months ago)
    {
      description: "Servis AC Rumah",
      notes: "Cuci AC 2 unit + freon",
      type: TransactionType.EXPENSE,
      amount: 550_000,
      categoryId: catRumah.id,
      walletFromId: bca.id,
      date: D(12, 2, 10, 0),
    },

    // ── Pendidikan (2 months ago)
    {
      description: "Kursus Online — Udemy",
      notes: "React + TypeScript Masterclass",
      type: TransactionType.EXPENSE,
      amount: 199_000,
      categoryId: catPendidikan.id,
      walletFromId: bca.id,
      date: D(7, 2, 11, 0),
    },

    // ── Perawatan Diri (2 months ago)
    {
      description: "Potong Rambut — Barbershop",
      type: TransactionType.EXPENSE,
      amount: 75_000,
      categoryId: catPerawatan.id,
      walletFromId: cash.id,
      date: D(11, 2, 10, 0),
    },
    {
      description: "Produk Perawatan — Watsons",
      type: TransactionType.EXPENSE,
      amount: 220_000,
      categoryId: catPerawatan.id,
      walletFromId: gopay.id,
      date: D(18, 2, 13, 0),
    },
  ];

  // ── Bulk-insert all transactions ──────────────────────────────
  await prisma.transaction.createMany({
    data: txRows.map((t) => ({
      userId: uid,
      description: t.description,
      notes: t.notes,
      type: t.type,
      amount: t.amount,
      categoryId: t.categoryId,
      walletFromId: t.walletFromId,
      walletToId: t.walletToId,
      date: t.date,
    })),
  });
  console.log(`   ✅  ${txRows.length} transactions created`);

  // ── 5. BUDGETS (current month) ─────────────────────────────
  console.log("🎯  Creating budgets…");

  // Calculate actual spent for each budget category in the current month
  const monthStart = new Date(cy, cm, 1, 0, 0, 0, 0);
  const monthEnd = new Date(cy, cm + 1, 0, 23, 59, 59, 999);

  const spentThisMonth = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: {
      userId: uid,
      type: TransactionType.EXPENSE,
      date: { gte: monthStart, lte: monthEnd },
    },
    _sum: { amount: true },
  });

  const spentMap = new Map(
    spentThisMonth.map((r) => [r.categoryId, Number(r._sum.amount ?? 0)]),
  );

  const budgetDefinitions = [
    { categoryId: catMakan.id, amount: 2_500_000 },
    { categoryId: catTransport.id, amount: 1_200_000 },
    { categoryId: catTagihan.id, amount: 1_500_000 },
    { categoryId: catHiburan.id, amount: 500_000 },
    { categoryId: catBelanja.id, amount: 1_000_000 },
    { categoryId: catKesehatan.id, amount: 600_000 },
    { categoryId: catSosial.id, amount: 400_000 },
  ];

  await prisma.budget.createMany({
    data: budgetDefinitions.map((b) => ({
      userId: uid,
      categoryId: b.categoryId,
      amount: b.amount,
      spent: spentMap.get(b.categoryId) ?? 0,
      period: "MONTHLY",
      month: cm + 1, // 1-indexed
      year: cy,
      isActive: true,
    })),
  });
  console.log(`   ✅  ${budgetDefinitions.length} budgets created`);

  // ── Summary ────────────────────────────────────────────────
  console.log("\n📊  Seed Summary");
  console.log("─────────────────────────────────────");
  console.log(`   👤  User    : ${user.name} (${user.email})`);
  console.log(`   👛  Wallets : 4`);
  console.log(`   🏷️   Categories: 17 (6 income + 11 expense)`);
  console.log(`   💸  Transactions: ${txRows.length}`);
  console.log(`   🎯  Budgets : ${budgetDefinitions.length}`);
  console.log("─────────────────────────────────────");
  console.log("✅  Database seeded successfully!\n");
}

main()
  .catch((e) => {
    console.error("❌  Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
