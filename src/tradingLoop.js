const { logTradeToExcel } = require("./utils/logTradeToExcel2");
const { safeCall, sendTelegramMessage, sleep } = require("./utils/utils");
const { detectManualOrAutoExit } = require("./utils/detectManualOrAutoExit");
const { checkAndTrade } = require("./trade/checkAndTrade");
const { checkExitAndTrade } = require("./trade/checkExitAndTrade");

const tradingLoop = async (
  inPosition,
  entryPrice,
  qtyBtc,
  lastPosition,
  symbol,
  logger,
  client
) => {
  logger.info("🔁 Memulai trading loop (async)...");
  while (global.isRunning) {
    try {
      const positionData = await safeCall(
        () => client.restAPI.positionInformationV2(symbol),
        logger
      );
      const positionAmt =
        positionData && positionData.length > 0
          ? parseFloat(positionData[0].positionAmt)
          : 0.0;

      if (inPosition && positionAmt === 0) {
        logger.info("🏁 Posisi tertutup (TP/SL/Manual/Reverse). Reset bot.");
        sendTelegramMessage(
          "🏁 Posisi keluar otomatis (TP/SL), manual, atau karena sinyal berlawanan.",
          logger
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

        await safeCall(
          () => client.restAPI.cancelAllOpenOrders(symbol),
          logger
        );

        inPosition = false;
        entryPrice = 0;
        qtyBtc = 0;
      }

      [lastPosition, entryPrice] = await detectManualOrAutoExit(
        symbol,
        lastPosition,
        entryPrice,
        client,
        logger
      );

      if (lastPosition === "WAIT") {
        [lastPosition, entryPrice] = await checkAndTrade({
          client,
          logger,
          symbol,
          lastPosition,
        });
      } else {
        [lastPosition, entryPrice] = await checkExitAndTrade({
          symbol,
          lastPosition,
          entryPrice,
          client,
          logger,
        });
      }

      await sleep(3000);
    } catch (err) {
      logger.error(`❗ Unhandled Error: ${err.message || err}`);
      await sleep(5000);
    }
  }

  logger.info("🛑 Trading loop dihentikan.");
};

module.exports = { tradingLoop };
