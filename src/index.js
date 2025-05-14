require("dotenv").config();
const express = require("express");
const winston = require("winston");
const { UMFutures } = require("@binance/futures-connector");

const app = express();
const PORT = 3000;

// === Import fungsi utilitas dan trading ===
const {
  initializeLogFile,
  logTradeToExcel,
} = require("./utils/logTradeToExcel2");
const { safeCall, sendTelegramMessage, sleep } = require("./utils/utils");
const { detectManualOrAutoExit } = require("./utils/detectManualOrAutoExit");
const { checkAndTrade } = require("./trade/checkAndTrade");
const { checkExitAndTrade } = require("./trade/checkExitAndTrade");

// === Bot State ===
let isRunning = false;
let inPosition = false;
let entryPrice = 0;
let qtyBtc = 0;
let lastPosition = "WAIT";
const symbol = "BTCUSDT";

// === Setup Logger ===
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    })
  ),
  transports: [new winston.transports.Console()],
});

logger.info("Starting server...");

const client = new UMFutures(
  process.env.BINANCE_API_KEY,
  process.env.BINANCE_API_SECRET,
  {
    // baseURL: "https://fapi.binance.com", // Untuk live trading
    baseURL: "https://testnet.binancefuture.com", // ← Gunakan ini untuk testnet
  }
);

// === Trading Loop Function ===
const tradingLoop = async () => {
  logger.info("🔁 Memulai trading loop (async)...");
  while (isRunning) {
    try {
      const positionData = await safeCall(client.getPositionRisk, [symbol]);
      const positionAmt =
        positionData && positionData.length > 0
          ? parseFloat(positionData[0].positionAmt)
          : 0.0;

      if (inPosition && positionAmt === 0) {
        logger.info("🏁 Posisi tertutup (TP/SL/Manual/Reverse). Reset bot.");
        sendTelegramMessage(
          "🏁 Posisi keluar otomatis (TP/SL), manual, atau karena sinyal berlawanan."
        );
        logTradeToExcel(
          new Date().toISOString().replace("T", " ").slice(0, 19),
          "AUTO EXIT (TP/SL/MANUAL)",
          entryPrice,
          "Exit Auto",
          entryPrice * qtyBtc,
          0,
          0
        );

        await safeCall(client.cancelAllOpenOrders, [{ symbol }]);

        inPosition = false;
        entryPrice = 0;
        qtyBtc = 0;
      }

      [lastPosition, entryPrice] = await detectManualOrAutoExit(
        symbol,
        lastPosition,
        entryPrice
      );

      if (lastPosition === "WAIT") {
        [lastPosition, entryPrice] = await checkAndTrade(symbol, lastPosition);
      } else {
        [lastPosition, entryPrice] = await checkExitAndTrade(
          symbol,
          lastPosition,
          entryPrice
        );
      }

      await sleep(3000);
    } catch (err) {
      logger.error(`❗ Unhandled Error: ${err.message || err}`);
      await sleep(5000);
    }
  }

  logger.info("🛑 Trading loop dihentikan.");
};

// === EXPRESS ROUTES ===
app.get("/start-bot", (req, res) => {
  if (!isRunning) {
    isRunning = true;
    tradingLoop();
    logger.info("✅ Bot dimulai melalui endpoint /start-bot");
    return res.send("✅ Bot dimulai.");
  } else {
    logger.warn("⚠️ Permintaan /start-bot saat bot sudah berjalan");
    return res.send("⚠️ Bot sudah berjalan.");
  }
});

app.get("/stop-bot", (req, res) => {
  if (isRunning) {
    isRunning = false;
    logger.info("🛑 Bot dihentikan melalui endpoint /stop-bot");
    return res.send("🛑 Bot dihentikan.");
  } else {
    logger.warn("⚠️ Permintaan /stop-bot saat bot tidak aktif");
    return res.send("⚠️ Bot tidak aktif.");
  }
});

app.get("/", (req, res) => {
  res.send(`<h2>💹 Trading Bot Server</h2>
    <p>Status: <b>${isRunning ? "Running" : "Stopped"}</b></p>
    <ul>
      <li><a href="/start-bot">▶️ Start Bot</a></li>
      <li><a href="/stop-bot">⏹ Stop Bot</a></li>
    </ul>`);
});

// === Start server & inisialisasi log ===
initializeLogFile();
app.listen(PORT, () => {
  logger.info(`🚀 Server running at http://localhost:${PORT}`);
});
