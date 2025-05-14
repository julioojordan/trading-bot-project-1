const ExcelJS = require("exceljs");
const fs = require("fs");

const logFile = "trade_log.xlsx";

const defaultSheetTrade = "log_cbt_mk6_rev2_sltp_logfixed_multisheet_autoexit";
const defaultSheetLog =
  "log_cbt_mk6_rev2_sltp_logfixed_multisheet_autoexit_info";

const logTradeToExcel = async (
  timestamp,
  signal,
  entryPrice,
  exitPrice,
  qtyUSDT,
  pnlUSDT,
  roi,
  sheetName = defaultSheetTrade
) => {
  const newRow = [
    timestamp,
    signal,
    entryPrice,
    exitPrice,
    qtyUSDT,
    pnlUSDT,
    roi,
  ];
  const headers = [
    "Timestamp",
    "Signal",
    "Entry Price",
    "Exit Price",
    "Qty (USDT)",
    "PnL (USDT)",
    "ROI (%)",
  ];

  await appendRowToSheet(logFile, sheetName, newRow, headers);
}

const logInfoToExcel = async (timestamp, message, sheetName = defaultSheetLog) => {
  const newRow = [timestamp, message];
  const headers = ["Timestamp", "Message"];

  await appendRowToSheet(logFile, sheetName, newRow, headers);
}

const appendRowToSheet = async (filePath, sheetName, rowData, headers) => {
  const workbook = new ExcelJS.Workbook();

  const fileExists = fs.existsSync(filePath);
  if (fileExists) {
    await workbook.xlsx.readFile(filePath);
  }

  let sheet = workbook.getWorksheet(sheetName);
  if (!sheet) {
    sheet = workbook.addWorksheet(sheetName);
    sheet.addRow(headers);
  }

  sheet.addRow(rowData);
  await workbook.xlsx.writeFile(filePath);
}

module.exports = {
  logTradeToExcel,
  logInfoToExcel,
};

// Contoh pemakaian:
// logTradeToExcel(new Date().toISOString(), 'BUY', 29000, 29500, 50, 25, 0.86);
// logInfoToExcel(new Date().toISOString(), 'Trade executed successfully.');
