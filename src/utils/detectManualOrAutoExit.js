const axios = require("axios");
const dayjs = require("dayjs");
const { logTradeToExcel, logInfoToExcel } = require("./logTradeToExcel");

const fixedQtyUSDT = 50; // ubah sesuai nilai kamu
const TELEGRAM_BOT_TOKEN = "your_bot_token";
const TELEGRAM_CHAT_ID = "your_chat_id";

// Fungsi bantu untuk panggil async API dan handle error
const safeCall = async (fn) => {
  try {
    return await fn();
  } catch (err) {
    console.error("Safe call error:", err.message);
    return null;
  }
}

// Kirim pesan Telegram
const sendTelegramMessage = async (message) => {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  try {
    await axios.post(url, {
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: "Markdown",
    });
  } catch (err) {
    console.error("Telegram send error:", err.message);
  }
}

// Fungsi utama
// TO DO client diisi ke binance connector nanti ya
const detectManualOrAutoExit = async (
  symbol,
  lastPosition,
  entryPrice,
  client
) => {
  const positionInfo = await safeCall(() => client.getPositionRisk({ symbol }));
  if (positionInfo && positionInfo.length > 0) {
    const positionAmt = parseFloat(positionInfo[0].positionAmt);
    if (Math.abs(positionAmt) < 0.0001 && entryPrice != null) {
      const timestamp = dayjs().format("YYYY-MM-DD HH:mm:ss");

      const ticker = await safeCall(() =>
        client.getSymbolPriceTicker({ symbol })
      );
      const exitPrice =
        ticker && ticker.price ? parseFloat(ticker.price) : null;

      const direction =
        lastPosition === "LONG" ? 1 : lastPosition === "SHORT" ? -1 : 1;

      let pnl = null,
        roi = null;
      if (exitPrice) {
        pnl = Number(
          (
            ((exitPrice - entryPrice) * direction * fixedQtyUSDT) /
            entryPrice
          ).toFixed(2)
        );
        roi = Number(((pnl / fixedQtyUSDT) * 100).toFixed(2));
      }

      const exitType = "AUTO EXIT (TP/SL) or MANUAL EXIT";
      const message = `⚠️ ${exitType} for ${symbol}
        Side: ${lastPosition}
        Exit Price: ${exitPrice ?? "-"}
        PnL: ${pnl !== null ? pnl : "-"} USDT | ROI: ${
        roi !== null ? roi : "-"
      }%
        Time: ${timestamp}`;

      console.log("📤 Telegram:", message);
      console.log("📝 Logging to Excel and console...");

      await sendTelegramMessage(message);
      await logTradeToExcel(
        timestamp,
        `${exitType} ${lastPosition}`,
        entryPrice,
        exitPrice,
        fixedQtyUSDT,
        pnl,
        roi
      );
      await logInfoToExcel(timestamp, message);

      console.log(`✅ ${exitType} processed and logged at ${timestamp}`);
      return ["WAIT", null];
    }
  }

  return [lastPosition, entryPrice];
}

module.exports = { detectManualOrAutoExit };
