import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { EMBED_COLOR } from "../config.js";

export function buildPanelMessage() {
  const embed = new EmbedBuilder()
    .setTitle("Kairon Systems")
    .setDescription(
      "Este panel está destinado al registro de todas las acciones, Registros, sanciones, ascensos, descensos, etc.\n\n" +
        "Para realizar uno de estos registros solo debes pulsar el botón y rellenar los parámetros.",
    )
    .setColor(EMBED_COLOR);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("btn_registro")
      .setLabel("📋 Registro")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("btn_promocion")
      .setLabel("⬆️ Promoción")
      .setStyle(ButtonStyle.Success),
  );

  return { embeds: [embed], components: [row] };
}
