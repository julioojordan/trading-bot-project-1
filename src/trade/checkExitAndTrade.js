const { openNewPosition } = require("./openNewPosition");
const { exitPosition } = require("./exitPosition");
const { getEmaCrossing, sendTelegramMessage, logInfoToExcel } = require("../utils");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const checkExitAndTrade = async ({ symbol, lastPosition, entryPrice, client, logger }) => {
  logger.info("📌 Memasuki fungsi async checkExitAndTrade");
  const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19);

  // ✅ 1. Cek apakah posisi kosong
  const positionInfo = await safeCall(client.restAPI.positionInformationV3, [symbol]);
  const positionAmt =
    positionInfo && positionInfo.length > 0 ? parseFloat(positionInfo[0].positionAmt) : 0.0;
  const posisiKosong = Math.abs(positionAmt) < 0.0001;

  if (posisiKosong && ["LONG", "SHORT"].includes(lastPosition)) {
    const message = `📤 Posisi otomatis tertutup (TP/SL Detected) | Side: ${lastPosition} | Time: ${timestamp}`;
    await sendTelegramMessage(message, logger);
    logger.info("📤 Posisi tertutup otomatis oleh TP/SL. Reset ke WAIT.");
    await logInfoToExcel(timestamp, message);
    return ["WAIT", null];
  }

  // ✅ 2. Ambil data EMA
  const df = await getEmaCrossing({ client, symbol, logger });
  if (!df || df.length < 2) {
    return [lastPosition, entryPrice];
  }

  const ema12_prev = df[df.length - 2].EMA12;
  const ema21_prev = df[df.length - 2].EMA21;
  const ema12_now = df[df.length - 1].EMA12;
  const ema21_now = df[df.length - 1].EMA21;

  const crossedUp = ema12_prev < ema21_prev && ema12_now > ema21_now;
  const crossedDown = ema12_prev > ema21_prev && ema12_now < ema21_now;

  logger.info(
    `📊 EMA Check (Exit): EMA12_prev=${ema12_prev.toFixed(
      2
    )}, EMA21_prev=${ema21_prev.toFixed(2)}, EMA12_now=${ema12_now.toFixed(
      2
    )}, EMA21_now=${ema21_now.toFixed(2)}`
  );

  const direction = crossedUp ? "UP" : crossedDown ? "DOWN" : "NONE";
  logger.info(`🔎 Crossing: ${direction}`);

  // ✅ 3. Exit & Entry berdasarkan crossing lawan
  if (lastPosition === "LONG" && crossedDown) {
    await exitPosition({ client, symbol, lastPosition, entryPrice, logger });
    await sleep(2000);
    const newEntry = await openNewPosition({ symbol, side: "SELL", client, logger });
    return ["SHORT", newEntry];
  }

  if (lastPosition === "SHORT" && crossedUp) {
    await exitPosition({ client, symbol, lastPosition, entryPrice, logger });
    await sleep(2000);
    const newEntry = await openNewPosition({ symbol, side: "BUY", client, logger });
    return ["LONG", newEntry];
  }

  // ✅ 4. Tidak ada aksi
  return [lastPosition, entryPrice];
};

module.exports = {
  checkExitAndTrade,
};
