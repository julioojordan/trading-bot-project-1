const technicalIndicators = require("technicalindicators");
const { openNewPosition } = require

// Misal: getEmaCrossing dan openNewPosition sudah didefinisikan async function di tempat lain
const checkAndTrade = async (symbol, lastPosition) => {
  const df = await getEmaCrossing(symbol);
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

  console.log(
    `📊 EMA Check: EMA12_prev=${ema12_prev.toFixed(
      2
    )}, EMA21_prev=${ema21_prev.toFixed(2)}, EMA12_now=${ema12_now.toFixed(
      2
    )}, EMA21_now=${ema21_now.toFixed(2)}`
  );
  console.log("🔎 Crossing:", crossedUp ? "UP" : crossedDown ? "DOWN" : "NONE");

  if (lastPosition === "WAIT") {
    if (crossedUp) {
      const result = await openNewPosition(symbol, "BUY");
      return ["LONG", result];
    } else if (crossedDown) {
      const result = await openNewPosition(symbol, "SELL");
      return ["SHORT", result];
    }
  }

  return [lastPosition, null];
};

module.exports = {
  checkAndTrade,
};
