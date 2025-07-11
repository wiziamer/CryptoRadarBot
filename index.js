const express = require("express");
const axios = require("axios");
const TelegramBot = require("node-telegram-bot-api");

const botToken = "8077026516:AAFi9UqCn_Cm_P52o1TRLsSReteKWdNVDWc"; // توكن البوت
const adminId = "5700745957"; // رقمك الشخصي على تيليجرام

const bot = new TelegramBot(botToken, { polling: true });

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

let lastCoins = [];
let lastTopVolume = [];

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, `أهلاً ${msg.from.first_name}! 👋\nأنا جاهز أرسل لك العملات الجديدة على شبكة سولانا، وأعلى عملتين فوليوم 🔥`);
});

bot.onText(/\/help/, (msg) => {
  const helpMessage = `
🆕 /latest – العملات الجديدة حالياً
🔥 /topvolume – أعلى عملتين فوليوم الآن
📊 /status – حالة البوت الحالية
  `;
  bot.sendMessage(msg.chat.id, helpMessage);
});

bot.onText(/\/latest/, async (msg) => {
  const coins = await fetchNewCoins();
  sendCoins(msg.chat.id, coins);
});

bot.onText(/\/topvolume/, async (msg) => {
  const top = await fetchTopVolume();
  sendTopVolume(msg.chat.id, top);
});

bot.onText(/\/status/, (msg) => {
  bot.sendMessage(msg.chat.id, `✅ البوت يعمل الآن...\n🟡 الشبكة: سولانا فقط\n📡 التحديث كل دقيقة`);
});

async function fetchNewCoins() {
  try {
    const response = await axios.get("https://api.dexscreener.com/latest/dex/pairs/solana");
    const data = response.data.pairs;
    return data.slice(0, 5);
  } catch (err) {
    console.error("fetchNewCoins error:", err);
    return [];
  }
}

async function fetchTopVolume() {
  try {
    const response = await axios.get("https://api.dexscreener.com/latest/dex/pairs/solana");
    const data = response.data.pairs;
    return data.sort((a, b) => b.volume.h24 - a.volume.h24).slice(0, 2);
  } catch (err) {
    console.error("fetchTopVolume error:", err);
    return [];
  }
}

function sendCoins(chatId, coins) {
  if (!coins.length) {
    bot.sendMessage(chatId, "🚫 لا توجد عملات جديدة.");
    return;
  }

  coins.forEach((coin) => {
    const msg = `
🚀 عملة جديدة على سولانا:

🔹 الإسم: ${coin.baseToken.name} (${coin.baseToken.symbol})
🔗 [رابط](https://dexscreener.com/solana/${coin.pairAddress})
📈 ماركت كاب: ${coin.fdv ? `$${(coin.fdv / 1e6).toFixed(2)}M` : "غير معروف"}
💰 السيولة: $${Math.round(coin.liquidity.usd)}
👥 عدد المحافظ: ${coin.txns.h1 || "؟"} آخر ساعة
`;
    bot.sendMessage(chatId, msg, { parse_mode: "Markdown" });
  });
}

function sendTopVolume(chatId, coins) {
  if (!coins.length) {
    bot.sendMessage(chatId, "🚫 لا يوجد بيانات فوليوم.");
    return;
  }

  let msg = "🔥 أعلى عملتين فوليوم على سولانا:\n\n";
  coins.forEach((coin, i) => {
    msg += `${i + 1}. ${coin.baseToken.name} (${coin.baseToken.symbol})\n`;
    msg += `📈 فوليوم 24h: $${Math.round(coin.volume.h24)}\n`;
    msg += `🔗 [رابط](https://dexscreener.com/solana/${coin.pairAddress})\n\n`;
  });

  bot.sendMessage(chatId, msg, { parse_mode: "Markdown" });
}

// كل دقيقة فحص تلقائي
setInterval(async () => {
  const coins = await fetchNewCoins();
  const newOnes = coins.filter(c => !lastCoins.find(l => l.pairAddress === c.pairAddress));
  if (newOnes.length && adminId) {
    lastCoins = coins;
    sendCoins(adminId, newOnes);
  }

  const top = await fetchTopVolume();
  const changed = JSON.stringify(top) !== JSON.stringify(lastTopVolume);
  if (changed && adminId) {
    lastTopVolume = top;
    sendTopVolume(adminId, top);
  }
}, 60000); // كل دقيقة

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
