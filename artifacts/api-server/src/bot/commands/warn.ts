import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  TextChannel,
} from "discord.js";
import { CHANNELS, EMBED_COLOR } from "../config.js";
import { addWarn } from "../storage.js";
import { logger } from "../../lib/logger.js";

export const data = new SlashCommandBuilder()
  .setName("warn")
  .setDescription("Emite un warn a un usuario")
  .addUserOption((opt) =>
    opt
      .setName("usuario")
      .setDescription("Usuario a sancionar")
      .setRequired(true),
  )
  .addStringOption((opt) =>
    opt.setName("motivo").setDescription("Motivo del warn").setRequired(true),
  );

export async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const target = interaction.options.getUser("usuario", true);
  const motivo = interaction.options.getString("motivo", true);
  const today = new Date().toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  addWarn(target.id, motivo, interaction.user.id);

  // DM to the sanctioned user
  try {
    await target.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("⚠️ Advertencia — Kairon Systems")
          .setDescription(
            `Se le ha emitido un warn por el motivo **${motivo}**.`,
          )
          .setColor(EMBED_COLOR)
          .setFooter({ text: `Kairon Systems • ${today}` }),
      ],
    });
  } catch {
    // User may have DMs disabled
  }

  // Embed to sanctions channel
  try {
    const channel = (await interaction.client.channels.fetch(
      CHANNELS.SANCIONES,
    )) as TextChannel;

    const sanctionEmbed = new EmbedBuilder()
      .setTitle("Kairon Systems")
      .setDescription(
        `<@${target.id}> ha sido sancionado por el motivo **${motivo}**.`,
      )
      .setColor(EMBED_COLOR)
      .setFooter({ text: `${interaction.user.tag} - ${today}` });

    await channel.send({ embeds: [sanctionEmbed] });
  } catch (err) {
    logger.error({ err }, "Error sending sanction embed to channel");
  }

  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setDescription(
          `✅ Warn emitido a <@${target.id}> por el motivo: **${motivo}**.`,
        )
        .setColor(EMBED_COLOR),
    ],
    ephemeral: true,
  });
}
