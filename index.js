const express = require("express");
const axios = require("axios");
const TelegramBot = require("node-telegram-bot-api");

const botToken = "8077026516:AAFi9UqCn_Cm_P52o1TRLsSReteKWdNVDWc";
const adminId = "5700745957"; // صاحب البوت

const bot = new TelegramBot(botToken, { polling: true });
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

let lastCoins = [];
let lastTopVolume = [];

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, `أهلاً ${msg.from.first_name} 👋\nأنا بوت دكتور كريبتو 🔍\nاكتب /help لعرض الأوامر.`);
});

bot.onText(/\/help/, (msg) => {
  const helpMessage = `
📌 الأوامر المتاحة:

🆕 /latest - العملات الجديدة حالياً
🔥 /topvolume - أعلى عملتين فوليوم الآن
📟 /status - حالة البوت الحالية
  `;
  bot.sendMessage(msg.chat.id, helpMessage);
});

bot.onText(/\/latest/, async (msg) => {
  const coins = await fetchNewCoins();
  sendCoins(msg.chat.id, coins);
});

bot.onText(/\/topvolume/, async (msg) => {
  const coins = await fetchTopVolumeCoins();
  sendCoins(msg.chat.id, coins);
});

bot.onText(/\/status/, (msg) => {
  bot.sendMessage(msg.chat.id, "✅ البوت شغال تمام 🎯");
});

// دالة تجيب العملات الجديدة
async function fetchNewCoins() {
  try {
    const res = await axios.get('https://api.dexscreener.com/latest/dex/pairs/solana');
    const coins = res.data.pairs.slice(0, 5); // أول 5 عملات
    return coins;
  } catch (error) {
    console.error("خطأ بجلب العملات:", error.message);
    return [];
  }
}

// دالة تجيب أعلى فوليوم
async function fetchTopVolumeCoins() {
  try {
    const res = await axios.get('https://api.dexscreener.com/latest/dex/pairs/solana');
    const sorted = res.data.pairs
      .filter(pair => pair.volume && pair.volume.h24)
      .sort((a, b) => b.volume.h24 - a.volume.h24);
    return sorted.slice(0, 2);
  } catch (error) {
    console.error("خطأ بجلب فوليوم:", error.message);
    return [];
  }
}

// إرسال النتائج
function sendCoins(chatId, coins) {
  if (!coins.length) {
    return bot.sendMessage(chatId, "🚫 ما في بيانات حالياً.");
  }

  for (const coin of coins) {
    const msg = `
🚀 *${coin.baseToken.symbol}*
💲 السعر: $${coin.priceUsd}
💧 السيولة: $${coin.liquidity?.usd?.toLocaleString()}
📊 فوليوم 24h: $${coin.volume?.h24?.toLocaleString()}
🔗 [الرابط المباشر](${coin.url})
    `;
    bot.sendMessage(chatId, msg, { parse_mode: "Markdown" });
  }
}

// بدء السيرفر (مطلوب لـ Render)
app.get("/", (req, res) => {
  res.send("DrCrypto bot is running...");
});

app.listen(PORT, () => {
  console.log(`🚀 Server live on port ${PORT}`);
});
