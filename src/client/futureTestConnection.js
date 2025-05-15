require("dotenv").config();
const { createClient } = require("./futureConnector");
const winston = require("winston");


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

async function testConnection() {
  const client = await createClient(logger);
  try {
    const accountBalance = await client.restAPI.futuresAccountBalanceV3();
    const accountBalanceData = await accountBalance.data();
    logger.info(`- Total Wallet Balance Test: ${accountBalanceData}`);
  } catch (error) {
    logger.error("❌ Gagal terhubung ke Binance Futures:");
    logger.error(error.response?.data || error.message);
  }
}

testConnection();
