const bot = require("../lib/bot");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(200).send("OP-PREMIUN ONLINE");
  }

  try {
    await bot.handleUpdate(req.body);
    return res.status(200).send("OK");
  } catch (error) {
    console.error("ERROR TELEGRAM:", error);
    return res.status(500).send("ERROR");
  }
};
