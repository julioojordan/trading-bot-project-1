const axios = require('axios');
const { EMA } = require('technicalindicators');

// TO DO ubah ini nanti Telegram
const BOT_TOKEN = '';
const CHAT_ID = '';

const sendTelegramMessage = async (message) => {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  const payload = {
    chat_id: CHAT_ID,
    text: message,
    parse_mode: 'HTML',
  };
  try {
    await axios.post(url, payload);
  } catch (error) {
    console.error('❗ Gagal kirim notifikasi Telegram:', error.message);
  }
}

// Safe call with retry logic
const safeCall = async (fn, args = [], retries = 3, delay = 2000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn(...args);
    } catch (error) {
      console.error(`❗ Error attempt ${i + 1}: ${error.message}`);
      await new Promise(res => setTimeout(res, delay));
    }
  }
  console.error('❌ Gagal setelah beberapa percobaan.');
  return null;
}

// Calculate quantity based on USDT value and leverage
const calculateQty = async (client, symbol, usdtValue, leverage) => {
  const ticker = await safeCall(() => client.restAPI.symbolPriceTickerV2(symbol));
  const price = ticker && ticker.price ? parseFloat(ticker.price) : 1;
  const qty = (usdtValue * leverage) / price;
  return Number(qty.toFixed(3));
}

// Set leverage for a given symbol
const setLeverage = async (client, symbol, leverage) => {
  return await safeCall(() => client.restAPI.changeInitialLeverage(symbol, leverage));
}

// Get EMA crossing using historical klines
const getEmaCrossing = async (client, symbol = 'BTCUSDT', interval = '1m', limit = 100) => {
  const klines = await safeCall(() => client.restAPI.klineCandlestickData(symbol, interval, undefined, undefined, limit));
  if (!klines || klines.length === 0) return null;

  const closes = klines.map(k => parseFloat(k[4]));
  const ema12 = EMA.calculate({ period: 12, values: closes });
  const ema21 = EMA.calculate({ period: 21, values: closes });

  const recentData = klines.map((k, idx) => ({
    close: closes[idx],
    ema12: idx >= 11 ? ema12[idx - 11] : null,
    ema21: idx >= 20 ? ema21[idx - 20] : null,
    timestamp: k[0],
  }));

  return recentData;
}

module.exports = {
  sendTelegramMessage,
  safeCall,
  calculateQty,
  setLeverage,
  getEmaCrossing,
};
