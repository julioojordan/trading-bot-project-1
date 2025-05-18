const axios = require("axios");
const dayjs = require("dayjs");
const { logTradeToExcel, logInfoToExcel } = require("./logTradeToExcel");
const { safeCall, sendTelegramMessage } = require("./utils");

const fixedQtyUSDT = 50; // ubah sesuai kebutuhan

// Fungsi utama
const detectManualOrAutoExit = async (
  symbol,
  lastPosition,
  entryPrice,
  client,
  logger
) => {
  const positionInfo = await safeCall(
    () => client.restAPI.positionInformationV3(symbol),
    logger
  );

  if (positionInfo && positionInfo.length > 0) {
    const positionAmt = parseFloat(positionInfo[0].positionAmt);

    if (Math.abs(positionAmt) < 0.0001 && entryPrice != null) {
      const timestamp = dayjs().format("YYYY-MM-DD HH:mm:ss");

      const ticker = await safeCall(
        () => client.restAPI.symbolPriceTickerV2(symbol),
        logger
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

      logger?.info(`📤 Telegram: ${message}`);
      logger?.info("📝 Logging to Excel and system...");

      await sendTelegramMessage(message, logger);
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

      logger?.info(`✅ ${exitType} processed and logged at ${timestamp}`);
      return ["WAIT", null];
    }
  }

  return [lastPosition, entryPrice];
};

module.exports = { detectManualOrAutoExit };
