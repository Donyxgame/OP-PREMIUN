
const { Telegraf, Markup } = require("telegraf");
const crypto = require("crypto");

if (!process.env.BOT_TOKEN) {
  throw new Error("Falta BOT_TOKEN");
}

const bot = new Telegraf(process.env.BOT_TOKEN);

const ADMIN_IDS = (process.env.ADMIN_IDS || "")
  .split(",").map(x => x.trim()).filter(Boolean);

const AUTHORIZED_IDS = (process.env.AUTHORIZED_IDS || "")
  .split(",").map(x => x.trim()).filter(Boolean);

// Keys disponibles: CLAIM_KEYS=ABC123,XYZ456
const CLAIM_KEYS = (process.env.CLAIM_KEYS || "")
  .split(",").map(x => x.trim()).filter(Boolean);

// Datos temporales: se reinician al reiniciar la aplicación.
const users = new Map();
const usedKeys = new Set();
const savedRecords = new Map();

function isAdmin(ctx) {
  return ADMIN_IDS.includes(String(ctx.from?.id || ""));
}

function isAuthorized(ctx) {
  const id = String(ctx.from?.id || "");
  return isAdmin(ctx) || AUTHORIZED_IDS.includes(id);
}

function getUser(ctx) {
  const id = String(ctx.from.id);

  if (!users.has(id)) {
    users.set(id, {
      plan: isAdmin(ctx) ? "ADMIN" : "BASIC",
      credits: isAdmin(ctx) ? 9999 : 10
    });
  }

  return users.get(id);
}

function requireAccess(ctx) {
  if (!isAuthorized(ctx)) {
    ctx.reply("⛔ No tienes autorización para utilizar este bot.");
    return false;
  }
  return true;
}

function getRecords(ctx) {
  const id = String(ctx.from.id);

  if (!savedRecords.has(id)) {
    savedRecords.set(id, []);
  }

  return savedRecords.get(id);
}

// MENÚ PRINCIPAL
bot.start(async ctx => {
  if (!requireAccess(ctx)) return;

  await ctx.reply(
    "🔐 OP-PREMIUN\n\n" +
    "Bienvenido al sistema privado.\n\n" +
    "Selecciona una opción:",
    Markup.inlineKeyboard([
      [Markup.button.callback("👤 Mi perfil", "PROFILE")],
      [Markup.button.callback("💰 Mis créditos", "CREDITOS")],
      [Markup.button.callback("📊 Estado del sistema", "STATUS")],
      [Markup.button.callback("🆘 Soporte", "SUPPORT")]
    ])
  );
});

// AYUDA
bot.help(async ctx => {
  if (!requireAccess(ctx)) return;

  await ctx.reply(
    "📚 COMANDOS OP-PREMIUN\n\n" +
    "/start - Menú principal\n" +
    "/profile - Mi perfil\n" +
    "/claim - Canjear una key\n" +
    "/save - Guardar un registro de prueba\n" +
    "/mycookies - Ver mis registros\n" +
    "/creditos - Consultar créditos\n" +
    "/gen - Generar datos ficticios\n" +
    "/gencookie - Generar cookie ficticia\n" +
    "/id - Mi identificador\n" +
    "/status - Estado del sistema"
  );
});

// PERFIL
bot.command("profile", async ctx => {
  if (!requireAccess(ctx)) return;

  const user = getUser(ctx);

  await ctx.reply(
    "👤 MI PERFIL\n\n" +
    "ID: " + ctx.from.id + "\n" +
    "Nombre: " + (ctx.from.first_name || "Usuario") + "\n" +
    "Plan: " + user.plan + "\n" +
    "Créditos: " + user.credits + "\n" +
    "Acceso: Autorizado"
  );
});

// CANJEAR KEY
bot.command("claim", async ctx => {
  if (!requireAccess(ctx)) return;

  const key = ctx.message.text.split(/\s+/)[1];

  if (!key) {
    return ctx.reply("Uso: /claim TU-KEY");
  }

  if (!CLAIM_KEYS.includes(key) || usedKeys.has(key)) {
    return ctx.reply("❌ Key inválida o ya utilizada.");
  }

  const user = getUser(ctx);
  user.credits += 50;
  usedKeys.add(key);

  await ctx.reply(
    "✅ KEY CANJEADA\n\n" +
    "Créditos añadidos: 50\n" +
    "Créditos actuales: " + user.credits
  );
});

// GUARDAR REGISTRO FICTICIO
bot.command("save", async ctx => {
  if (!requireAccess(ctx)) return;

  const args = ctx.message.text.trim().split(/\s+/);
  const name = args[1];
  const value = args[2];

  if (!name || !value) {
    return ctx.reply("Uso: /save nombre test_dato");
  }

  if (!value.startsWith("test_")) {
    return ctx.reply(
      "⛔ Solo se permiten datos ficticios con prefijo test_."
    );
  }

  const records = getRecords(ctx);

  records.unshift({
    name: name.slice(0, 30),
    value: value.slice(0, 100),
    date: new Date().toISOString()
  });

  if (records.length > 10) records.pop();

  await ctx.reply("✅ Registro ficticio guardado.");
});

// VER REGISTROS
bot.command("mycookies", async ctx => {
  if (!requireAccess(ctx)) return;

  const records = getRecords(ctx);

  if (!records.length) {
    return ctx.reply("📂 Todavía no tienes registros guardados.");
  }

  const output = records.map((r, i) =>
    `${i + 1}. ${r.name}: ${r.value}`
  ).join("\n");

  await ctx.reply("📂 TUS REGISTROS\n\n" + output);
});

// CRÉDITOS
bot.command("creditos", async ctx => {
  if (!requireAccess(ctx)) return;

  const user = getUser(ctx);

  await ctx.reply(
    "💰 TUS CRÉDITOS\n\n" +
    "Disponibles: " + user.credits
  );
});

// GENERAR DATOS FICTICIOS
bot.command("gen", async ctx => {
  if (!requireAccess(ctx)) return;

  const user = getUser(ctx);

  if (user.credits < 1) {
    return ctx.reply("❌ No tienes créditos suficientes.");
  }

  user.credits--;

  const data = Array.from({ length: 5 }, () =>
    "TEST-" + crypto.randomBytes(4).toString("hex").toUpperCase()
  );

  await ctx.reply(
    "🧪 DATOS FICTICIOS DE PRUEBA\n\n" +
    data.join("\n") +
    "\n\nCréditos restantes: " + user.credits
  );
});

// COOKIE FICTICIA
bot.command("gencookie", async ctx => {
  if (!requireAccess(ctx)) return;

  const user = getUser(ctx);

  if (user.credits < 1) {
    return ctx.reply("❌ No tienes créditos suficientes.");
  }

  user.credits--;

  const fakeCookie =
    "test_" + crypto.randomBytes(16).toString("hex");

  await ctx.reply(
    "🧪 COOKIE FICTICIA DE PRUEBA\n\n" +
    fakeCookie +
    "\n\nNo sirve para iniciar sesión.\n" +
    "Créditos restantes: " + user.credits
  );
});

// IDENTIFICADOR
bot.command("id", async ctx => {
  await ctx.reply("Tu Telegram ID es: " + ctx.from.id);
});

// ESTADO
bot.command("status", async ctx => {
  if (!requireAccess(ctx)) return;

  await ctx.reply(
    "🟢 Sistema operativo\n" +
    "🔐 Acceso privado\n" +
    "🤖 Telegram conectado"
  );
});

// ADMINISTRACIÓN
bot.command("admin", async ctx => {
  if (!isAdmin(ctx)) {
    return ctx.reply("⛔ Solo administradores.");
  }

  await ctx.reply(
    "🛠 PANEL ADMINISTRATIVO\n\n" +
    "Usuarios autorizados: " + AUTHORIZED_IDS.length + "\n" +
    "Keys configuradas: " + CLAIM_KEYS.length + "\n" +
    "Keys utilizadas: " + usedKeys.size
  );
});

bot.command("usuarios", async ctx => {
  if (!isAdmin(ctx)) {
    return ctx.reply("⛔ Solo administradores.");
  }

  await ctx.reply(
    "👥 Usuarios autorizados: " + AUTHORIZED_IDS.length
  );
});

// BOTONES
bot.action("PROFILE", async ctx => {
  await ctx.answerCbQuery();
  if (!requireAccess(ctx)) return;

  const user = getUser(ctx);

  await ctx.reply(
    "👤 Perfil\n" +
    "Plan: " + user.plan + "\n" +
    "Créditos: " + user.credits
  );
});

bot.action("CREDITOS", async ctx => {
  await ctx.answerCbQuery();
  if (!requireAccess(ctx)) return;

  await ctx.reply("💰 Créditos: " + getUser(ctx).credits);
});

bot.action("STATUS", async ctx => {
  await ctx.answerCbQuery();
  if (!requireAccess(ctx)) return;

  await ctx.reply("🟢 OP-PREMIUN está operativo.");
});

bot.action("SUPPORT", async ctx => {
  await ctx.answerCbQuery();
  if (!requireAccess(ctx)) return;

  await ctx.reply("🆘 Contacta con el administrador.");
});

// MENSAJES
bot.on("text", async ctx => {
  if (!isAuthorized(ctx)) {
    return ctx.reply("⛔ No tienes autorización.");
  }

  await ctx.reply(
    "Mensaje recibido. Escribe /help para ver los comandos."
  );
});

module.exports = bot;
