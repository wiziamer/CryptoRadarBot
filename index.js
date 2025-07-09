const express = require("express");
const axios = require("axios");
const TelegramBot = require("node-telegram-bot-api");

const botToken = process.env.BOT_TOKEN;
const bot = new TelegramBot(botToken, { polling: true });

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "CryptoRadarBot is up and running 🚀");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
