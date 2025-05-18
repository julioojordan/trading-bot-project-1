const { DateTime } = require("luxon");
const { sendTelegramMessage } = require("../utils/utils");
const { logTradeToExcel2 } = require("../utils");

const openNewPosition = async ({
  symbol,
  side,
  client,
  fixedQtyUSDT,
  riskPercent,
  rewardRiskRatio,
  logger,
}) => {
  try {
    const ticker = await client.restAPI.symbolPriceTickerV2(symbol);
    const entryPrice = ticker?.price ? parseFloat(ticker.price) : 0.0;
    const timestamp = DateTime.now().toFormat("yyyy-LL-dd HH:mm:ss");

    if (entryPrice === 0) {
      logger?.warn("⚠️ Invalid price, aborting order.");
      return null;
    }

    const qty = parseFloat((fixedQtyUSDT / entryPrice).toFixed(3));

    // Hitung SL dan TP
    const riskAmount = entryPrice * riskPercent;
    const tpPrice =
      side === "BUY"
        ? entryPrice + riskAmount * rewardRiskRatio
        : entryPrice - riskAmount * rewardRiskRatio;
    const slPrice =
      side === "BUY" ? entryPrice - riskAmount : entryPrice + riskAmount;

    // 🟢 Market Entry
    await client.restAPI.newOrder(
      symbol,
      side,
      "MARKET",
      "BOTH",
      undefined,
      qty
    );

    const oppositeSide = side === "BUY" ? "SELL" : "BUY";

    // 🎯 Take Profit Order
    await client.restAPI.newOrder(
      symbol,
      oppositeSide,
      "TAKE_PROFIT_MARKET",
      "BOTH",
      "GTC",
      undefined,
      undefined,
      undefined,
      undefined,
      tpPrice.toFixed(2),
      "true"
    );

    // 🛑 Stop Loss Order
    await client.restAPI.newOrder(
      symbol,
      oppositeSide,
      "STOP_MARKET",
      "BOTH",
      "GTC",
      undefined,
      undefined,
      undefined,
      undefined,
      slPrice.toFixed(2),
      "true"
    );

    // 📤 Kirim Telegram
    const message = `🔔 <b>NEW ${side} POSITION</b> ${symbol}\nEntry: ${entryPrice}\nTime: ${timestamp}\nQty: ${qty} BTC\nSL: ${slPrice.toFixed(
      2
    )} | TP: ${tpPrice.toFixed(2)}`;
    await sendTelegramMessage(message, logger);

    logger?.info(
      `🟢 ENTRY EXECUTED: ${side} | ${symbol} | Price: ${entryPrice} | Time: ${timestamp}`
    );

    // 📝 Log ke Excel/Sheets
    await logTradeToExcel2(
      timestamp,
      `ENTRY ${side}`,
      entryPrice,
      null,
      qty * entryPrice,
      slPrice,
      tpPrice
    );

    return entryPrice;
  } catch (err) {
    logger?.error("❗ Error in openNewPosition:", err.message || err);
    return null;
  }
};

module.exports = {
  openNewPosition,
};
