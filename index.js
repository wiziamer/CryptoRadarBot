const express = require("express");
const axios = require("axios");
const TelegramBot = require("node-telegram-bot-api");

const botToken = process.env.BOT_TOKEN;
const adminId = process.env.ADMIN_ID;
const bot = new TelegramBot(botToken, { polling: true });

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());

let lastCoins = [];

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    `أهلاً ${msg.from.first_name} 👋\nأنا بوت المراقبة الذكي 💡 أرسل لك أحدث العملات على DEX 🚀\n\nاكتب /help لعرض الأوامر`
  );
});

bot.onText(/\/help/, (msg) => {
  const helpMessage = `
🧠 أوامر البوت:
🆕 /latest – عرض أحدث العملات
📊 /stats – عرض إحصائيات عامة
🧪 /filter – عرض الفلاتر المفعلة
  `;
  bot.sendMessage(msg.chat.id, helpMessage);
});

bot.onText(/\/filter/, (msg) => {
  const msgTxt = `🔍 حالياً لا يتم تطبيق فلاتر. يتم عرض كل العملات الجديدة تلقائياً ✅`;
  bot.sendMessage(msg.chat.id, msgTxt);
});

bot.onText(/\/latest/, async (msg) => {
  const chatId = msg.chat.id;
  const coins = await fetchNewCoins();
  sendCoins(chatId, coins);
});

async function fetchNewCoins() {
  try {
    const response = await axios.get("https://api.cryptoradar.ai/new"); // API متخيّل من المشروع
    return response.data.slice(0, 5); // أول 5 عملات
  } catch (error) {
    console.error("Error fetching coins:", error.message);
    return [];
  }
}

function sendCoins(chatId, coins) {
  if (!coins.length) {
    bot.sendMessage(chatId, "🚫 لا توجد عملات جديدة حالياً.");
    return;
  }

  coins.forEach((coin, index) => {
    let msg = `🚀 عملة جديدة رقم ${index + 1}:\n`;
    msg += `💠 الاسم: ${coin.name}\n`;
    msg += `🌐 الشبكة: ${coin.network}\n`;
    msg += `📈 ماركت كاب: ${coin.marketCap}\n`;
    msg += `💰 السيولة: ${coin.liquidity}\n`;
    msg += `👥 عدد الهولدرز: ${coin.holders}\n`;
    msg += `🧠 تقييم الذكاء الاصطناعي: ${coin.aiScore}/100\n`;
    msg += `🔗 رابط العقد: ${coin.link}\n`;
    msg += `🛒 شراء سريع: https://jup.ag/swap/SOL/${coin.address}\n`;

    bot.sendMessage(chatId, msg);
  });
}

// إرسال العملات الجديدة تلقائياً كل 5 دقائق
setInterval(async () => {
  const coins = await fetchNewCoins();
  const newOnes = coins.filter((c) => !lastCoins.find((lc) => lc.name === c.name));
  if (newOnes.length) {
    lastCoins = coins;
    if (adminId) sendCoins(adminId, newOnes);
  }
}, 300000); // كل 5 دقائق

app.listen(PORT, () => {
  console.log(`✅ السيرفر شغال على المنفذ ${PORT}`);
});
