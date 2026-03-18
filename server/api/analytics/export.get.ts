// server/api/transactions/export.get.ts
// Export transactions to a styled Excel (.xlsx) file

import ExcelJS from "exceljs";
import prisma from "~/server/utils/prisma";

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const query = getQuery(event) as { month?: string; year?: string };

  const month = query.month ? parseInt(query.month) : new Date().getMonth() + 1;
  const year = query.year ? parseInt(query.year) : new Date().getFullYear();

  const MONTHS_ID = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  const periodLabel = `${MONTHS_ID[month - 1]} ${year}`;

  // 1. Fetch data
  const transactions = await prisma.transaction.findMany({
    where: {
      userId: user.id,
      date: {
        gte: new Date(year, month - 1, 1, 0, 0, 0, 0),
        lte: new Date(year, month, 0, 23, 59, 59, 999),
      },
    },
    include: {
      category: true,
      walletFrom: true,
      walletTo: true,
    },
    orderBy: { date: "asc" },
  });

  // 2. Create Workbook
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "CashPlow Budget Tracker";
  workbook.lastModifiedBy = user.name;
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Laporan Transaksi");

  // 3. Define Columns
  sheet.columns = [
    { header: "No", key: "no", width: 5 },
    { header: "Tanggal", key: "date", width: 15 },
    { header: "Keterangan", key: "description", width: 30 },
    { header: "Kategori", key: "category", width: 20 },
    { header: "Tipe", key: "type", width: 12 },
    { header: "Dompet", key: "wallet", width: 20 },
    { header: "Nominal (IDR)", key: "amount", width: 18 },
  ];

  // 4. Style Header (Emerald Green)
  const headerRow = sheet.getRow(1);
  headerRow.height = 30;
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF10B981" }, // CashPlow Emerald
    };
    cell.font = {
      name: "Inter",
      bold: true,
      color: { argb: "FFFFFFFF" },
      size: 11,
    };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  // 5. Add Data Rows
  transactions.forEach((tx, index) => {
    const walletName =
      tx.type === "TRANSFER"
        ? `${tx.walletFrom?.name || "?"} → ${tx.walletTo?.name || "?"}`
        : tx.walletFrom?.name || tx.walletTo?.name || "-";

    const row = sheet.addRow({
      no: index + 1,
      date: tx.date.toLocaleDateString("id-ID"),
      description: tx.description || tx.category.name,
      category: tx.category.name,
      type:
        tx.type === "INCOME"
          ? "Pemasukan"
          : tx.type === "EXPENSE"
            ? "Pengeluaran"
            : "Transfer",
      wallet: walletName,
      amount: Number(tx.amount),
    });

    // Style data cell (formatting IDR and alignment)
    row.getCell("amount").numFmt = "#,##0";
    row.getCell("type").font = {
      color: {
        argb:
          tx.type === "INCOME"
            ? "FF10B981"
            : tx.type === "EXPENSE"
              ? "FFEF4444"
              : "FF3B82F6",
      },
      bold: true,
    };

    // Zebra Striping
    if (index % 2 !== 0) {
      row.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF9FAFB" }, // Very light gray
        };
      });
    }

    row.alignment = { vertical: "middle" };
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FFE5E7EB" } },
        left: { style: "thin", color: { argb: "FFE5E7EB" } },
        bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
        right: { style: "thin", color: { argb: "FFE5E7EB" } },
      };
    });
  });

  // 6. Summary Row at Bottom
  const totalIncome = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((s, t) => s + Number(t.amount), 0);

  sheet.addRow([]); // Spacer
  const summaryRow = sheet.addRow({
    wallet: "TOTAL PEMASUKAN",
    amount: totalIncome,
  });
  summaryRow.getCell("wallet").font = { bold: true };
  summaryRow.getCell("amount").font = {
    bold: true,
    color: { argb: "FF10B981" },
  };
  summaryRow.getCell("amount").numFmt = "#,##0";

  const summaryExpRow = sheet.addRow({
    wallet: "TOTAL PENGELUARAN",
    amount: totalExpense,
  });
  summaryExpRow.getCell("wallet").font = { bold: true };
  summaryExpRow.getCell("amount").font = {
    bold: true,
    color: { argb: "FFEF4444" },
  };
  summaryExpRow.getCell("amount").numFmt = "#,##0";

  // 7. Generate buffer and return
  const buffer = await workbook.xlsx.writeBuffer();

  const filename = `Laporan_CashPlow_${periodLabel.replace(" ", "_")}.xlsx`;

  setHeaders(event, {
    "Content-Type":
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition": `attachment; filename="${filename}"`,
  });

  return buffer;
});
