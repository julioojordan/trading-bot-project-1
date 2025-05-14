require("dotenv").config();
const {
  DerivativesTradingUsdsFutures,
  DERIVATIVES_TRADING_USDS_FUTURES_REST_API_TESTNET_URL,
} = require("@binance/derivatives-trading-usds-futures");

// Inisialisasi client dari .env

async function testConnection() {
  const configurationRestAPI = {
    apiKey: process.env.BINANCE_API_KEY,
    apiSecret: process.env.BINANCE_API_SECRET,
    basePath: DERIVATIVES_TRADING_USDS_FUTURES_REST_API_TESTNET_URL, // kalo live ini hapus aja kali (?)
  };
  const client = new DerivativesTradingUsdsFutures({ configurationRestAPI });
  try {
    // ✅ Pakai method yang benar
    const accountInfo = await client.restAPI.accountInformationV2();
    const accountInfoData = await accountInfo.data();
    const accountBalance = await client.restAPI.futuresAccountBalanceV3()
    const accountBalanceData = await accountBalance.data();

    console.log("✅ Koneksi berhasil!");
    console.log("🧾 Informasi Akun: ", accountInfoData);
    console.log(`- Total Wallet Balance: ${accountBalanceData}`);
  } catch (error) {
    console.error("❌ Gagal terhubung ke Binance Futures:");
    console.error(error.response?.data || error.message);
  }
}

testConnection();
