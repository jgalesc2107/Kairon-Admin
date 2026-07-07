import {
  ActionRowBuilder,
  UserSelectMenuBuilder,
  EmbedBuilder,
  ButtonInteraction,
  UserSelectMenuInteraction,
  GuildMember,
  TextChannel,
} from "discord.js";
import { CHANNELS, EMBED_COLOR, PROMO_ROLES } from "../config.js";
import { logger } from "../../lib/logger.js";

export async function handlePromocionButton(
  interaction: ButtonInteraction,
): Promise<void> {
  const row = new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(
    new UserSelectMenuBuilder()
      .setCustomId("select_promo_user")
      .setPlaceholder("Selecciona el usuario a ascender")
      .setMinValues(1)
      .setMaxValues(1),
  );

  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setTitle("⬆️ Promoción — Aspirante")
        .setDescription(
          "Selecciona el usuario que deseas ascender a **Aspirante**.",
        )
        .setColor(EMBED_COLOR),
    ],
    components: [row],
    ephemeral: true,
  });
}

export async function handlePromocionSelect(
  interaction: UserSelectMenuInteraction,
): Promise<void> {
  const selectedId = interaction.values[0];
  if (!selectedId) {
    await interaction.reply({
      content: "No se seleccionó ningún usuario.",
      ephemeral: true,
    });
    return;
  }

  const guild = interaction.guild;
  if (!guild) {
    await interaction.reply({
      content: "Este comando solo funciona en un servidor.",
      ephemeral: true,
    });
    return;
  }

  let member: GuildMember;
  try {
    member = await guild.members.fetch(selectedId);
  } catch {
    await interaction.update({
      embeds: [
        new EmbedBuilder()
          .setDescription(
            "❌ No se pudo encontrar al usuario en el servidor.",
          )
          .setColor(EMBED_COLOR),
      ],
      components: [],
    });
    return;
  }

  try {
    await member.roles.add([...PROMO_ROLES.ADD]);
    for (const roleId of PROMO_ROLES.REMOVE) {
      if (member.roles.cache.has(roleId)) {
        await member.roles.remove(roleId);
      }
    }
  } catch (err) {
    logger.error({ err }, "Error managing promotion roles");
    await interaction.update({
      embeds: [
        new EmbedBuilder()
          .setDescription(
            "❌ Error al gestionar los roles. Comprueba que el bot tiene permisos suficientes.",
          )
          .setColor(EMBED_COLOR),
      ],
      components: [],
    });
    return;
  }

  const today = new Date().toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const resultEmbed = new EmbedBuilder()
    .setTitle("⬆️ Promoción")
    .setColor(EMBED_COLOR)
    .addFields(
      { name: "👤 Usuario", value: `<@${selectedId}>`, inline: true },
      { name: "🏅 Cargo", value: "Aspirante", inline: true },
      {
        name: "👮 Promovido por",
        value: `<@${interaction.user.id}>`,
        inline: true,
      },
    )
    .setFooter({ text: `${interaction.user.tag} • ${today}` })
    .setTimestamp();

  try {
    const channel = (await interaction.client.channels.fetch(
      CHANNELS.PROMOCION,
    )) as TextChannel;
    await channel.send({ embeds: [resultEmbed] });
  } catch (err) {
    logger.error({ err }, "Error sending promotion embed to channel");
  }

  await interaction.update({
    embeds: [
      new EmbedBuilder()
        .setDescription(
          `✅ <@${selectedId}> ha sido ascendido a **Aspirante** correctamente.`,
        )
        .setColor(EMBED_COLOR),
    ],
    components: [],
  });
}
