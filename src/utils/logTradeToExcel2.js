const ExcelJS = require("exceljs");
const fs = require("fs");

const logFile = "../tradeLog/trade_log.xlsx";

const logColumns = [
  "Timestamp",
  "Signal",
  "Entry Price",
  "Exit Price",
  "Qty (USDT)",
  "PnL (USDT)",
  "ROI (%)",
];

// ✅ Cek apakah file Excel sudah ada, kalau belum buat dengan header
const initializeLogFile = async () => {
  if (!fs.existsSync(logFile)) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Sheet1");
    sheet.addRow(logColumns);
    await workbook.xlsx.writeFile(logFile);
    console.log("🆕 Log file created.");
  }
};

// ✅ Fungsi log trade ke Excel
const logTradeToExcel = async (
  timestamp,
  signal,
  entryPrice,
  exitPrice,
  qtyUSDT,
  pnlUSDT,
  roi
) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(logFile);

  const sheet = workbook.getWorksheet("Sheet1") || workbook.worksheets[0];

  const newRow = [
    timestamp,
    signal,
    entryPrice,
    exitPrice,
    qtyUSDT,
    pnlUSDT,
    roi,
  ];

  sheet.addRow(newRow);
  await workbook.xlsx.writeFile(logFile);
  console.log("✅ Trade log saved to Excel.");
};

// ✅ Panggil saat pertama kali jalan
// initializeLogFile();

// 📌 Contoh pemanggilan fungsi
// logTradeToExcel('2025-05-14 21:00:00', 'BUY', 29000, 29400, 50, 6.9, 1.3);

module.exports = {
  initializeLogFile,
  logTradeToExcel,
};
