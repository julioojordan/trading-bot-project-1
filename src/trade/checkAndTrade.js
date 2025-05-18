const { openNewPosition } = require("../trade");
const { getEmaCrossing } = require("../utils");

const checkAndTrade = async ({ client, logger, symbol, lastPosition }) => {
  const df = await getEmaCrossing({ client, symbol, logger });
  if (!df || df.length < 2) {
    return [lastPosition, null];
  }

  // Ambil 2 data terakhir untuk EMA12 dan EMA21
  const ema12_prev = df[df.length - 2].EMA12;
  const ema21_prev = df[df.length - 2].EMA21;
  const ema12_now = df[df.length - 1].EMA12;
  const ema21_now = df[df.length - 1].EMA21;

  const crossedUp = ema12_prev < ema21_prev && ema12_now > ema21_now;
  const crossedDown = ema12_prev > ema21_prev && ema12_now < ema21_now;

  logger.info(
    `📊 EMA Check: EMA12_prev=${ema12_prev.toFixed(
      2
    )}, EMA21_prev=${ema21_prev.toFixed(2)}, EMA12_now=${ema12_now.toFixed(
      2
    )}, EMA21_now=${ema21_now.toFixed(2)}`
  );
  const crossing = crossedUp ? "UP" : crossedDown ? "DOWN" : "NONE";
  logger.info(`🔎 Crossing: ${crossing}`);

  if (lastPosition === "WAIT") {
    if (crossedUp) {
      const result = await openNewPosition({ symbol, side: "BUY", client, logger });
      return ["LONG", result];
    } else if (crossedDown) {
      const result = await openNewPosition({ symbol, side: "SELL", client, logger });
      return ["SHORT", result];
    }
  }

  return [lastPosition, null];
};

module.exports = {
  checkAndTrade,
};
