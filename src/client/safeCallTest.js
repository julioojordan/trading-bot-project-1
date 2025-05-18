
const { safeCall, logger } = require("../utils")
let count = 0;

const flakyCall = async () => {
  count++;
  if (count < 3) {
    console.log(`⚠️ Gagal ke-${count}`);
    throw new Error("Simulasi error sementara");
  }
  console.log("🟢 Berhasil di percobaan ke-3");
  return "Sukses retry!";
};

const test2 = async () => {
  const result = await safeCall(flakyCall, logger);
  console.log("✅ Hasil:", result);
};

test2();
