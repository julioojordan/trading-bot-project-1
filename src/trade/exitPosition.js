const {
  sendTelegramMessage,
  safeCall,
  logTradeToExcel2,
  updateTradeStats,
} = require("../utils");
const { DateTime } = require("luxon");

const exitPosition = async (client, symbol, lastPosition, entryPrice) => {
  const accountInfo = await safeCall(() =>
    client.restAPI.accountInformationV3()
  );
  const positions = accountInfo?.positions || [];

  const pos = positions.find((p) => p.symbol === symbol);
  if (!pos) return;

  const qty = Math.abs(parseFloat(pos.positionAmt));
  if (qty <= 0) return;

  const sideToExit = parseFloat(pos.positionAmt) < 0 ? "BUY" : "SELL";
  const ticker = await safeCall(() =>
    client.restAPI.symbolPriceTickerV2(symbol)
  );
  console.log("📦 Ticker result at exit:", ticker);

  const exitPrice = ticker?.price ? parseFloat(ticker.price) : 0.0;
  const timestamp = DateTime.now().toFormat("yyyy-LL-dd HH:mm:ss");

  const modalUSDT = entryPrice * qty;
  const pnlUSDT =
    lastPosition === "LONG"
      ? (exitPrice - entryPrice) * qty
      : (entryPrice - exitPrice) * qty;

  const roi = modalUSDT !== 0 ? (pnlUSDT / modalUSDT) * 100 : 0;

  // Eksekusi order market untuk keluar posisi
  await safeCall(() =>
    client.restAPI.newOrder(
      symbol, // symbol 
      sideToExit, // side (BUY / SELL)
      "MARKET", // type
      "BOTH", // positionSide ("LONG"/"SHORT" jika pakai hedge mode)
      undefined, // timeInForce (MARKET order tidak perlu)
      qty // quantity
    )
  );

  console.log(
    `🔴 EXIT EXECUTED: ${sideToExit} | ${symbol} | Exit Price: ${exitPrice} | Time: ${timestamp}`
  );

  // Logging
  await logTradeToExcel2(
    timestamp,
    `EXIT ${lastPosition}`,
    entryPrice,
    exitPrice,
    modalUSDT,
    pnlUSDT,
    roi
  );
  updateTradeStats(pnlUSDT);

  // Kirim ke Telegram
  const message = `❌ <b>EXIT ${lastPosition}</b> ${symbol}\nExit: ${exitPrice}\nTime: ${timestamp}\nROI: ${roi.toFixed(
    2
  )}% | PnL: $${pnlUSDT.toFixed(2)} | Modal: $${modalUSDT.toFixed(2)}`;
  await sendTelegramMessage(message);
};

module.export = {
  exitPosition,
};
