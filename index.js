require("dotenv").config();

const { Telegraf, Markup } = require("telegraf");

if (!process.env.BOT_TOKEN) {
  throw new Error("Falta configurar BOT_TOKEN");
}

const bot = new Telegraf(process.env.BOT_TOKEN);

// CONFIGURACIÓN DEL PRODUCTO
const PRODUCT = {
  id: "digital_product_001",
  name: "Producto Digital Premium",
  description: "Acceso a nuestro producto digital.",
  price: 100
};

// MENÚ PRINCIPAL
bot.start(async (ctx) => {
  await ctx.reply(
    "👋 ¡Bienvenido a nuestra tienda!\n\n" +
    "📦 " + PRODUCT.name + "\n" +
    "⭐ Precio: " + PRODUCT.price + " Telegram Stars\n\n" +
    "Selecciona una opción:",
    Markup.inlineKeyboard([
      [Markup.button.callback("🛒 Comprar", "BUY")],
      [Markup.button.callback("📦 Ver producto", "INFO")],
      [Markup.button.callback("🆘 Soporte", "SUPPORT")]
    ])
  );
});

// INFORMACIÓN DEL PRODUCTO
bot.action("INFO", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.reply(
    "📦 " + PRODUCT.name +
    "\n\n" + PRODUCT.description +
    "\n\nPrecio: " + PRODUCT.price + " Stars"
  );
});

// GENERAR FACTURA DE TELEGRAM STARS
bot.action("BUY", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.replyWithInvoice({
    title: PRODUCT.name,
    description: PRODUCT.description,
    payload: PRODUCT.id,
    provider_token: "",
    currency: "XTR",
    prices: [
      {
        label: PRODUCT.name,
        amount: PRODUCT.price
      }
    ]
  });
});

// VALIDAR ANTES DEL PAGO
bot.on("pre_checkout_query", async (ctx) => {
  const query = ctx.update.pre_checkout_query;

  const valid =
    query.invoice_payload === PRODUCT.id &&
    query.currency === "XTR" &&
    query.total_amount === PRODUCT.price;

  await ctx.answerPreCheckoutQuery(
    valid,
    valid ? undefined : "Pedido inválido."
  );
});

// CONFIRMAR Y ENTREGAR
bot.on("message", async (ctx) => {
  const payment = ctx.message.successful_payment;

  if (!payment) return;

  const valid =
    payment.invoice_payload === PRODUCT.id &&
    payment.currency === "XTR" &&
    payment.total_amount === PRODUCT.price;

  if (!valid) {
    return ctx.reply(
      "No se pudo validar el pedido. Contacta con soporte."
    );
  }

  // No entregar si el identificador del pago ya fue procesado.
  // En producción, guardar este identificador en una base de datos
  // con una restricción UNIQUE antes de entregar el producto.

  if (process.env.PRODUCT_FILE_ID) {
    await ctx.replyWithDocument(
      process.env.PRODUCT_FILE_ID,
      { caption: "✅ ¡Pago confirmado! Aquí tienes tu producto." }
    );
  } else if (process.env.PRODUCT_DOWNLOAD_URL) {
    await ctx.reply(
      "✅ ¡Pago confirmado!\n\n" +
      "Tu producto está disponible aquí:\n" +
      process.env.PRODUCT_DOWNLOAD_URL
    );
  } else {
    await ctx.reply(
      "✅ ¡Pago confirmado! Contacta con soporte para recibir tu producto."
    );
  }
});

// SOPORTE
bot.action("SUPPORT", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.reply(
    "🆘 ¿Necesitas ayuda con tu compra? Contacta con nuestro equipo de soporte."
  );
});

bot.command("paysupport", async (ctx) => {
  await ctx.reply(
    "Para cualquier problema con un pago, contacta con soporte."
  );
});

bot.launch();

console.log("🚀 Telegram Store Bot iniciado.");

// Cierre ordenado
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
