// TO DO Global Stats / set to config / set in db as a setting ?
let winCount = 0;
let lossCount = 0;
let totalPnl = 0.0;

// Fungsi update statistik berdasarkan nilai PnL
const updateTradeStats = (pnl) => {
  totalPnl += pnl;

  if (pnl > 0) {
    winCount += 1;
  } else if (pnl < 0) {
    lossCount += 1;
  }

  console.log(`📈 Total Win: ${winCount} | ❌ Total Loss: ${lossCount} | 💰 Net PnL: $${totalPnl.toFixed(2)}`);
}

module.exports = {
  updateTradeStats
};
