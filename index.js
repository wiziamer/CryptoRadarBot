const express = require("express");
const axios = require("axios");
const TelegramBot = require("node-telegram-bot-api");

const botToken = process.env.BOT_TOKEN;
const adminId = process.env.ADMIN_ID;

const bot = new TelegramBot(botToken, { polling: true });
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, `أهلاً ${msg.from.first_name}! 👋\nأنا جاهز أبلغك عن العملات الجديدة أول ما تنزل 🔥\n\nاكتب /help لعرض الأوامر.`);
});

bot.onText(/\/help/, (msg) => {
  const helpText = `
📌 الأوامر المتاحة:

🆕 /latest – عرض آخر العملات الجديدة
📊 /stats – إحصائيات عامة (قريباً)
🧠 /filter – عرض الفلاتر (تم تعطيل التصفية حالياً)
  `;
  bot.sendMessage(msg.chat.id, helpText);
});

bot.onText(/\/latest/, async (msg) => {
  const chatId = msg.chat.id;
  const coins = await fetchNewCoins();
  if (!coins.length) {
    bot.sendMessage(chatId, "🚫 لا توجد عملات جديدة حالياً.");
    return;
  }
  sendCoins(chatId, coins);
});

bot.onText(/\/filter/, (msg) => {
  bot.sendMessage(msg.chat.id, `🔍 لا يتم تطبيق أي فلاتر حالياً ✅`);
});

async function fetchNewCoins() {
  try {
    const res = await axios.get("https://api.dexscreener.com/latest/dex/pairs");
    const now = Date.now();

    const freshCoins = res.data.pairs.filter(pair => {
      const createdAt = new Date(pair.pairCreatedAt).getTime();
      return now - createdAt <= 60000; // أقل من دقيقة
    });

    return freshCoins.slice(0, 5); // خذ أول 5 عملات بس
  } catch (err) {
    console.error("❌ خطأ أثناء جلب العملات:", err.message);
    return [];
  }
}

function sendCoins(chatId, coins) {
  let message = `🚀 عملات جديدة تم إضافتها الآن:\n\n`;

  coins.forEach((pair, idx) => {
    message += `🔸 ${idx + 1}. ${pair.baseToken.name} (${pair.baseToken.symbol})\n`;
    message += `🟡 الشبكة: ${pair.chainId}\n`;
    message += `📈 السعر: ${pair.priceUsd} $\n`;
    message += `🔗 [رابط التحليل](${pair.url})\n\n`;
  });

  bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
}

// 🔁 إرسال تلقائي للعملات الجديدة كل 30 ثانية
setInterval(async () => {
  const coins = await fetchNewCoins();
  if (coins.length && adminId) {
    sendCoins(adminId, coins);
  }
}, 30000); // كل 30 ثانية

app.listen(PORT, () => {
  console.log(`✅ السيرفر شغّال على البورت ${PORT}`);
});
