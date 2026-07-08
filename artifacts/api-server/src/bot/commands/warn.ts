import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  TextChannel,
  PermissionFlagsBits,
} from "discord.js";
import { CHANNELS, EMBED_COLOR } from "../config.js";
import { addWarn, getUserWarns } from "../storage.js";
import { applyAutoSanction } from "../handlers/autoSanction.js";
import { logger } from "../../lib/logger.js";

export const data = new SlashCommandBuilder()
  .setName("warn")
  .setDescription("Emite un warn a un usuario")
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
  .setDMPermission(false)
  .addUserOption((opt) =>
    opt
      .setName("usuario")
      .setDescription("Usuario a sancionar")
      .setRequired(true),
  )
  .addStringOption((opt) =>
    opt
      .setName("motivo")
      .setDescription("Motivo del warn")
      .setRequired(true)
      .setMaxLength(500),
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
  const totalWarns = getUserWarns(target.id).length;

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

  // Responder al moderador primero (Discord requiere respuesta en <3s)
  const isThreshold = [2, 4, 6, 8].includes(totalWarns);
  const warnNote = isThreshold
    ? `\n⚠️ **${totalWarns} warns acumulados** — aplicando sanción automática…`
    : `\nTotal de warns: **${totalWarns}**.`;

  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setDescription(
          `✅ Warn emitido a <@${target.id}> por el motivo: **${motivo}**.${warnNote}`,
        )
        .setColor(EMBED_COLOR),
    ],
    ephemeral: true,
  });

  // Sanción automática — actualizar la respuesta efímera con el resultado real
  if (isThreshold) {
    try {
      const member = await interaction.guild?.members.fetch(target.id);
      const sanctionDesc = member
        ? await applyAutoSanction(member, totalWarns, interaction)
        : null;

      const resultNote = sanctionDesc
        ? `\n✅ Sanción aplicada: ${sanctionDesc}`
        : `\n❌ No se pudo aplicar la sanción automática (verifica permisos del bot).`;

      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `✅ Warn emitido a <@${target.id}> por el motivo: **${motivo}**.${resultNote}`,
            )
            .setColor(EMBED_COLOR),
        ],
      });
    } catch (err) {
      logger.error({ err }, "Error applying auto-sanction");
      await interaction
        .editReply({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                `✅ Warn emitido a <@${target.id}>.\n❌ Error al aplicar la sanción automática.`,
              )
              .setColor(EMBED_COLOR),
          ],
        })
        .catch(() => {});
    }
  }
}
