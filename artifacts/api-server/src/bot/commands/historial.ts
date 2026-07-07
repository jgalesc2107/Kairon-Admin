import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
} from "discord.js";
import { EMBED_COLOR } from "../config.js";
import { getUserWarns } from "../storage.js";

export const data = new SlashCommandBuilder()
  .setName("historial")
  .setDescription("Ver el historial de sanciones de un usuario")
  .addUserOption((opt) =>
    opt
      .setName("usuario")
      .setDescription("Usuario a consultar")
      .setRequired(true),
  );

export async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const target = interaction.options.getUser("usuario", true);
  const warns = getUserWarns(target.id);

  const embed = new EmbedBuilder()
    .setTitle("📋 Historial de Sanciones")
    .setColor(EMBED_COLOR)
    .setThumbnail(target.displayAvatarURL())
    .setDescription(
      warns.length === 0
        ? `<@${target.id}> no tiene sanciones registradas.`
        : `<@${target.id}> tiene **${warns.length}** warn${warns.length !== 1 ? "s" : ""} registrado${warns.length !== 1 ? "s" : ""}.`,
    );

  for (let i = 0; i < warns.length; i++) {
    const w = warns[i]!;
    embed.addFields({
      name: `⚠️ Warn #${i + 1} — ${w.date}`,
      value: `**Motivo:** ${w.reason}\n**Moderador:** <@${w.moderatorId}>`,
      inline: false,
    });
  }

  await interaction.reply({ embeds: [embed], ephemeral: true });
}
