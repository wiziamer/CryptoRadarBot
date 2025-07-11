const express = require("express");
const axios = require("axios");
const TelegramBot = require("node-telegram-bot-api");

const botToken = process.env.BOT_TOKEN;
const bot = new TelegramBot(botToken);

// Express App
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());

// Webhook Config
app.post(`/bot${botToken}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});
bot.setWebHook(`${process.env.BASE_URL}/bot${botToken}`);

let lastCoins = [];

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, `أهلاً ${msg.from.first_name}! 👋\nأنا هنا عشان أساعدك تتابع أحدث العملات والمشاريع على الشبكات الذكية.\n\nاكتب /help لعرض قائمة الأوامر.`);
});

bot.onText(/\/help/, (msg) => {
  const helpMessage = `
قائمة الأوامر المتاحة:
🆕 /latest – عرض العملات الجديدة
🧠 /filter – عرض الفلاتر المفعلة حالياً (تم إيقاف التصفية مؤقتاً)
📊 /stats – عرض إحصائيات عامة
  `;
  bot.sendMessage(msg.chat.id, helpMessage);
});

bot.onText(/\/latest/, async (msg) => {
  const chatId = msg.chat.id;
  const coins = await fetchNewCoins();
  sendCoins(chatId, coins);
});

bot.onText(/\/filter/, (msg) => {
  const msgTxt = `🔍 حالياً لا يتم تطبيق أي فلاتر.\nكل العملات الجديدة ستظهر عند إضافتها ✅`;
  bot.sendMessage(msg.chat.id, msgTxt);
});

async function fetchNewCoins() {
  try {
    const response = await axios.get("https://api.cryptoradar.ai/new");
    return response.data.slice(0, 5);
  } catch (error) {
    console.error("Error fetching coins:", error);
    return [];
  }
}

function sendCoins(chatId, coins) {
  if (!coins.length) {
    bot.sendMessage(chatId, "🚫 لا توجد عملات جديدة حالياً.");
    return;
  }

  let message = "🚀 العملات الجديدة:\n\n";
  coins.forEach((coin, index) => {
    message += `${index + 1}. ${coin.name} على شبكة ${coin.network}\n`;
    message += `رابط: ${coin.link}\n`;
    message += `📈 ماركت كاب: ${coin.marketCap} 💰\n\n`;
  });

  bot.sendMessage(chatId, message);
}

// إرسال العملات الجديدة تلقائيًا كل 5 دقائق
setInterval(async () => {
  const coins = await fetchNewCoins();
  const newOnes = coins.filter(c => !lastCoins.find(lc => lc.name === c.name));
  if (newOnes.length) {
    lastCoins = coins;
    const adminId = process.env.ADMIN_ID;
    if (adminId) sendCoins(adminId, newOnes);
  }
}, 300000); // 5 دقائق

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
