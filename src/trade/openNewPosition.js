const { DateTime } = require("luxon");
const { sendTelegramMessage } = require("../utils/utils");
const { logTradeToExcel } = require("../utils/logTradeToExcel2");

const openNewPosition = async (
  symbol,
  side,
  client,
  fixedQtyUSDT, // ini dapet dari env aja kah ?
  riskPercent,
  rewardRiskRatio
) => {
  try {
    const ticker = await client.getSymbolPriceTicker({ symbol });
    const entryPrice = ticker?.price ? parseFloat(ticker.price) : 0.0;
    const timestamp = DateTime.now().toFormat("yyyy-LL-dd HH:mm:ss");

    if (entryPrice === 0) {
      console.warn("⚠️ Invalid price, aborting order.");
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
    await client.submitNewOrder({
      symbol,
      side,
      type: "MARKET",
      quantity: qty,
    });

    const oppositeSide = side === "BUY" ? "SELL" : "BUY";

    // 🎯 Take Profit
    await client.submitNewOrder({
      symbol,
      side: oppositeSide,
      type: "TAKE_PROFIT_MARKET",
      stopPrice: tpPrice.toFixed(2),
      closePosition: true,
      timeInForce: "GTC",
    });

    // 🛑 Stop Loss
    await client.submitNewOrder({
      symbol,
      side: oppositeSide,
      type: "STOP_MARKET",
      stopPrice: slPrice.toFixed(2),
      closePosition: true,
      timeInForce: "GTC",
    });

    // 📤 Kirim Telegram
    const message = `🔔 <b>NEW ${side} POSITION</b> ${symbol}\nEntry: ${entryPrice}\nTime: ${timestamp}\nQty: ${qty} BTC\nSL: ${slPrice.toFixed(
      2
    )} | TP: ${tpPrice.toFixed(2)}`;
    await sendTelegramMessage(message);

    console.log(
      `🟢 ENTRY EXECUTED: ${side} | ${symbol} | Price: ${entryPrice} | Time: ${timestamp}`
    );

    // 📝 Log ke Excel/Sheets
    await logTradeToExcel(
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
    console.error("❗ Error in openNewPosition:", err.message || err);
    return null;
  }
};

module.exports = {
  openNewPosition,
};
