require("dotenv").config();
const {
  DerivativesTradingUsdsFutures,
  DERIVATIVES_TRADING_USDS_FUTURES_REST_API_TESTNET_URL,
} = require("@binance/derivatives-trading-usds-futures");

const createClient = async (logger) => {
  const configurationRestAPI = {
    apiKey: process.env.BINANCE_API_KEY,
    apiSecret: process.env.BINANCE_API_SECRET,
    basePath: DERIVATIVES_TRADING_USDS_FUTURES_REST_API_TESTNET_URL, //tesnet
  };
  const client = new DerivativesTradingUsdsFutures({ configurationRestAPI });

  try {
    const accountInfo = await client.restAPI.accountInformationV2();
    logger.info("✅ Koneksi berhasil!");
    logger.info("🧾 Informasi Akun: ", accountInfo);
  } catch (error) {
    logger.error("❌ Gagal terhubung ke Binance Futures:");
    logger.error(error.response?.data || error.message);
  }

  return client
};

module.exports= {
  createClient
}
