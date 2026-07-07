import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  StringSelectMenuInteraction,
} from "discord.js";
import { EMBED_COLOR } from "../config.js";
import { getUserWarns, deleteWarn } from "../storage.js";

export const data = new SlashCommandBuilder()
  .setName("delwarn")
  .setDescription("Elimina un warn de un usuario")
  .addUserOption((opt) =>
    opt
      .setName("usuario")
      .setDescription("Usuario del que eliminar el warn")
      .setRequired(true),
  );

export async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const target = interaction.options.getUser("usuario", true);
  const warns = getUserWarns(target.id);

  if (warns.length === 0) {
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setDescription(`✅ <@${target.id}> no tiene warns registrados.`)
          .setColor(EMBED_COLOR),
      ],
      ephemeral: true,
    });
    return;
  }

  const options = warns.map((w) => {
    const label =
      w.reason.length > 50 ? w.reason.substring(0, 47) + "..." : w.reason;
    return new StringSelectMenuOptionBuilder()
      .setValue(w.id)
      .setLabel(label)
      .setDescription(`Fecha: ${w.date}`);
  });

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`delwarn_select_${target.id}`)
      .setPlaceholder("Selecciona el warn a eliminar")
      .addOptions(options),
  );

  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setTitle("🗑️ Eliminar Warn")
        .setDescription(
          `Warns de <@${target.id}> **(${warns.length} total)**:\n\nSelecciona el warn que deseas eliminar.`,
        )
        .setColor(EMBED_COLOR),
    ],
    components: [row],
    ephemeral: true,
  });
}

export async function handleDelwarnSelect(
  interaction: StringSelectMenuInteraction,
): Promise<void> {
  const parts = interaction.customId.split("_");
  const userId = parts[parts.length - 1] ?? "";
  const warnId = interaction.values[0] ?? "";

  const deleted = deleteWarn(userId, warnId);

  await interaction.update({
    embeds: [
      new EmbedBuilder()
        .setDescription(
          deleted
            ? `✅ Warn eliminado correctamente de <@${userId}>.`
            : `❌ No se encontró el warn seleccionado.`,
        )
        .setColor(EMBED_COLOR),
    ],
    components: [],
  });
}
