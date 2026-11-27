

const { Telegraf, Markup } = require("telegraf");

if (!process.env.BOT_TOKEN) {
  throw new Error("Falta BOT_TOKEN");
}

const bot = new Telegraf(process.env.BOT_TOKEN);

const ADMIN_IDS = (process.env.ADMIN_IDS || "")
  .split(",")
  .map(id => id.trim())
  .filter(Boolean);

const AUTHORIZED_IDS = (process.env.AUTHORIZED_IDS || "")
  .split(",")
  .map(id => id.trim())
  .filter(Boolean);

function isAuthorized(ctx) {
  const id = String(ctx.from?.id || "");

  return ADMIN_IDS.includes(id) ||
    AUTHORIZED_IDS.includes(id);
}

function isAdmin(ctx) {
  return ADMIN_IDS.includes(String(ctx.from?.id || ""));
}

bot.start(async ctx => {
  if (!isAuthorized(ctx)) {
    return ctx.reply("⛔ No tienes autorización para utilizar este bot.");
  }

  await ctx.reply(
    "🔐 OP-PREMIUN\n\n" +
    "Bienvenido al sistema privado.\n\n" +
    "Selecciona una opción:",
    Markup.inlineKeyboard([
      [Markup.button.callback("📊 Estado del bot", "STATUS")],
      [Markup.button.callback("👤 Mi perfil", "PROFILE")],
      [Markup.button.callback("🆘 Soporte", "SUPPORT")]
    ])
  );
});

bot.action("STATUS", async ctx => {
  await ctx.answerCbQuery();

  if (!isAuthorized(ctx)) {
    return ctx.reply("⛔ Acceso denegado.");
  }

  await ctx.reply(
    "🟢 Sistema operativo\n" +
    "🔐 Acceso privado\n" +
    "🤖 Telegram conectado"
  );
});

bot.action("PROFILE", async ctx => {
  await ctx.answerCbQuery();

  if (!isAuthorized(ctx)) {
    return ctx.reply("⛔ Acceso denegado.");
  }

  await ctx.reply(
    "👤 INFORMACIÓN DEL USUARIO\n\n" +
    "ID: " + ctx.from.id + "\n" +
    "Nombre: " + (ctx.from.first_name || "Usuario") + "\n" +
    "Acceso: Autorizado"
  );
});

bot.action("SUPPORT", async ctx => {
  await ctx.answerCbQuery();

  if (!isAuthorized(ctx)) {
    return ctx.reply("⛔ Acceso denegado.");
  }

  await ctx.reply("🆘 Contacta con el administrador.");
});

bot.command("id", async ctx => {
  await ctx.reply("Tu Telegram ID es: " + ctx.from.id);
});

bot.command("usuarios", async ctx => {
  if (!isAdmin(ctx)) {
    return ctx.reply("⛔ Solo administradores.");
  }

  await ctx.reply(
    "Usuarios autorizados: " + AUTHORIZED_IDS.length
  );
});

bot.on("text", async ctx => {
  if (!isAuthorized(ctx)) {
    return ctx.reply("⛔ No tienes autorización.");
  }

  await ctx.reply(
    "Mensaje recibido correctamente. Utiliza /start para ver el menú."
  );
});

module.exports = bot;
