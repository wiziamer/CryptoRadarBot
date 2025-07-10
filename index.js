const express = require("express");
const axios = require("axios");
const TelegramBot = require("node-telegram-bot-api");

const botToken = process.env.BOT_TOKEN;
const bot = new TelegramBot(botToken, { polling: true });

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ────────────── Start Command ──────────────
bot.onText(/\/start/, (msg) => {
  const welcomeMsg = `
👋 أهلاً ${msg.chat.first_name || 'بك'} في CryptoRadarBot!
أنا هنا عشان أساعدك تتابع أحدث العملات والمشاريع على الشبكات الذكية.

اكتب /help لعرض قائمة الأوامر.
  `;
  bot.sendMessage(msg.chat.id, welcomeMsg);
});

// ────────────── Help Command ──────────────
bot.onText(/\/help/, (msg) => {
  const helpMsg = `
📌 الأوامر المتاحة:

/start – تفعيل البوت
/help – عرض هذه القائمة
/latest – عرض أحدث العملات الجديدة
/filter – عرض الفلاتر المفعلة حاليًا
  `;
  bot.sendMessage(msg.chat.id, helpMsg);
});

// ────────────── Latest Command ──────────────
bot.onText(/\/latest/, async (msg) => {
  try {
    // ملاحظة: لازم تربطها بقاعدة بياناتك أو API خارجي
    const sampleData = [
      { name: "LILPEPE", network: "Solana", link: "https://dexscreener.com/solana" },
      { name: "MOON100X", network: "ETH", link: "https://dexscreener.com/ethereum" }
    ];

    let reply = "🚀 العملات الجديدة:\n\n";
    sampleData.forEach((coin, index) => {
      reply += `${index + 1}. ${coin.name} - على شبكة ${coin.network}\nرابط: ${coin.link}\n\n`;
    });

    bot.sendMessage(msg.chat.id, reply);
  } catch (err) {
    bot.sendMessage(msg.chat.id, "❌ فشل في جلب العملات. حاول لاحقاً.");
  }
});

// ────────────── Filter Command ──────────────
bot.onText(/\/filter/, (msg) => {
  const filters = `
🔎 الفلاتر المفعلة حالياً:

✅ السيولة فوق 5K  
✅ عدد الهولدرز أكثر من 50  
✅ العقد لا يحتوي على مشاكل واضحة  
✅ تقييم AI أعلى من 80٪  
  `;
  bot.sendMessage(msg.chat.id, filters);
});

// ────────────── Server Listener ──────────────
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
