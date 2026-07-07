import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} from "discord.js";
import { EMBED_COLOR } from "../config.js";
import { getUserWarns } from "../storage.js";

const MAX_FIELDS = 25;

export const data = new SlashCommandBuilder()
  .setName("historial")
  .setDescription("Ver el historial de sanciones de un usuario")
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
  .setDMPermission(false)
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
  const display = warns.slice(-MAX_FIELDS);
  const truncated = warns.length > MAX_FIELDS;

  const embed = new EmbedBuilder()
    .setTitle("📋 Historial de Sanciones")
    .setColor(EMBED_COLOR)
    .setThumbnail(target.displayAvatarURL())
    .setDescription(
      warns.length === 0
        ? `<@${target.id}> no tiene sanciones registradas.`
        : `<@${target.id}> tiene **${warns.length}** warn${warns.length !== 1 ? "s" : ""} registrado${warns.length !== 1 ? "s" : ""}${truncated ? ` (mostrando los últimos ${MAX_FIELDS})` : ""}.`,
    );

  for (let i = 0; i < display.length; i++) {
    const w = display[i]!;
    const reason =
      w.reason.length > 900 ? w.reason.substring(0, 897) + "..." : w.reason;
    embed.addFields({
      name: `⚠️ Warn #${warns.length - display.length + i + 1} — ${w.date}`,
      value: `**Motivo:** ${reason}\n**Moderador:** <@${w.moderatorId}>`,
      inline: false,
    });
  }

  await interaction.reply({ embeds: [embed], ephemeral: true });
}
