require("dotenv").config();
const express = require("express");
const winston = require("winston");

// === Import fungsi utilitas dan trading ===
const { initializeLogFile } = require("./utils/logTradeToExcel2");
const { createClient } = require("./client/futureConnector");
const { tradingLoop } = require("./tradingLoop");

const startServer = async () => {
  // === Bot State ===
  global.isRunning = false;

  // == initial var ===
  let inPosition = false;
  let entryPrice = 0;
  let qtyBtc = 0;
  let lastPosition = "WAIT";
  const symbol = "BTCUSDT";

  // === EXPRESS ===
  const app = express();
  const PORT = 3000;

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

  logger.info("Starting futures client...");
  const client = await createClient(logger);
  logger.info("Futures client Started...");
  logger.info("Starting server...");

  // === EXPRESS ROUTES ===
  app.get("/start-bot", (req, res) => {
    if (!isRunning) {
      isRunning = true;
      tradingLoop(
        inPosition,
        entryPrice,
        qtyBtc,
        lastPosition,
        symbol,
        logger,
        client
      );
      logger.info("✅ Bot dimulai melalui endpoint /start-bot");
      return res.send("✅ Bot dimulai.");
    } else {
      logger.warn("⚠️ Permintaan /start-bot saat bot sudah berjalan");
      return res.send("⚠️ Bot sudah berjalan.");
    }
  });

  app.get("/stop-bot", (req, res) => {
    if (global.isRunning) {
      global.isRunning = false;
      logger.info("🛑 Bot dihentikan melalui endpoint /stop-bot");
      return res.send("🛑 Bot dihentikan.");
    } else {
      logger.warn("⚠️ Permintaan /stop-bot saat bot tidak aktif");
      return res.send("⚠️ Bot tidak aktif.");
    }
  });

  app.get("/", (req, res) => {
    res.send(`<h2>💹 Trading Bot Server</h2>
    <p>Status: <b>${global.isRunning ? "Running" : "Stopped"}</b></p>
    <ul>
      <li><a href="/start-bot">▶️ Start Bot</a></li>
      <li><a href="/stop-bot">⏹ Stop Bot</a></li>
    </ul>`);
  });

  // === Start server & inisialisasi log ===
  logger.info("Initialize Log...");
  await initializeLogFile();
  app.listen(PORT, () => {
    logger.info(`🚀 Server running at http://localhost:${PORT}`);
  });
};

startServer();