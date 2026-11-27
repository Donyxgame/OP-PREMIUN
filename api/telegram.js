const bot = require("../lib/bot");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;

  if (
    secret &&
    req.headers["x-telegram-bot-api-secret-token"] !== secret
  ) {
    return res.status(401).send("Unauthorized");
  }

  try {
    await bot.handleUpdate(req.body);
    return res.status(200).send("OK");
  } catch (error) {
    console.error("Telegram error:", error.message);
    return res.status(500).send("Internal error");
  }
};

