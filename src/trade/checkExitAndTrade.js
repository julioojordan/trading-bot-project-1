const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const checkExitAndTrade = async (symbol, lastPosition, entryPrice) => {
  const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19);
  const df = await getEmaCrossing(symbol);

  if (!df || df.length < 2) {
    return [lastPosition, entryPrice];
  }

  const ema12_prev = df[df.length - 2].EMA12;
  const ema21_prev = df[df.length - 2].EMA21;
  const ema12_now = df[df.length - 1].EMA12;
  const ema21_now = df[df.length - 1].EMA21;

  const crossedUp = ema12_prev < ema21_prev && ema12_now > ema21_now;
  const crossedDown = ema12_prev > ema21_prev && ema12_now < ema21_now;

  console.log(
    `📊 EMA Check (Exit): EMA12_prev=${ema12_prev.toFixed(
      2
    )}, EMA21_prev=${ema21_prev.toFixed(2)}, EMA12_now=${ema12_now.toFixed(
      2
    )}, EMA21_now=${ema21_now.toFixed(2)}`
  );
  console.log("🔎 Crossing:", crossedUp ? "UP" : crossedDown ? "DOWN" : "NONE");

  if (lastPosition === "LONG" && crossedDown) {
    await exitPosition(symbol, lastPosition, entryPrice);
    await sleep(2000); // delay 2 detik
    const newEntry = await openNewPosition(symbol, "SELL");
    return ["SHORT", newEntry];
  } else if (lastPosition === "SHORT" && crossedUp) {
    await exitPosition(symbol, lastPosition, entryPrice);
    await sleep(2000); // delay 2 detik
    const newEntry = await openNewPosition(symbol, "BUY");
    return ["LONG", newEntry];
  }

  return [lastPosition, entryPrice];
};

module.exports = {
  checkExitAndTrade,
};
