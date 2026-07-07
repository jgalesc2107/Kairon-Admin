import {
  ActionRowBuilder,
  UserSelectMenuBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  EmbedBuilder,
  ButtonInteraction,
  UserSelectMenuInteraction,
  StringSelectMenuInteraction,
  GuildMember,
  TextChannel,
} from "discord.js";
import { CHANNELS, EMBED_COLOR, PROMO_ROLES } from "../config.js";
import { logger } from "../../lib/logger.js";

/** Opciones de ascenso disponibles. Añade más aquí cuando sea necesario. */
const PROMO_OPTIONS: { label: string; value: string; description: string }[] = [
  {
    label: "Aspirante",
    value: "aspirante",
    description: "Ascender al rango de Aspirante",
  },
];

/** Paso 1 — seleccionar el tipo de promoción */
export async function handlePromocionButton(
  interaction: ButtonInteraction,
): Promise<void> {
  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("select_promo_type")
      .setPlaceholder("Selecciona el tipo de promoción")
      .addOptions(
        PROMO_OPTIONS.map((opt) =>
          new StringSelectMenuOptionBuilder()
            .setLabel(opt.label)
            .setValue(opt.value)
            .setDescription(opt.description),
        ),
      ),
  );

  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setTitle("⬆️ Promoción")
        .setDescription("Selecciona el tipo de promoción que deseas realizar.")
        .setColor(EMBED_COLOR),
    ],
    components: [row],
    ephemeral: true,
  });
}

/** Paso 2 — tipo seleccionado, mostrar selector de usuario */
export async function handlePromocionTypeSelect(
  interaction: StringSelectMenuInteraction,
): Promise<void> {
  const promoType = interaction.values[0] ?? "aspirante";

  const row = new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(
    new UserSelectMenuBuilder()
      .setCustomId(`select_promo_user:${promoType}`)
      .setPlaceholder("Selecciona el usuario a ascender")
      .setMinValues(1)
      .setMaxValues(1),
  );

  const label = PROMO_OPTIONS.find((o) => o.value === promoType)?.label ?? promoType;

  await interaction.update({
    embeds: [
      new EmbedBuilder()
        .setTitle(`⬆️ Promoción — ${label}`)
        .setDescription(`Selecciona el usuario que deseas ascender a **${label}**.`)
        .setColor(EMBED_COLOR),
    ],
    components: [row],
  });
}

/** Paso 3 — usuario seleccionado, aplicar roles y publicar embed */
export async function handlePromocionSelect(
  interaction: UserSelectMenuInteraction,
): Promise<void> {
  // El tipo va codificado en el customId: "select_promo_user:<type>"
  const promoType = interaction.customId.split(":")[1] ?? "aspirante";
  const label = PROMO_OPTIONS.find((o) => o.value === promoType)?.label ?? promoType;

  const selectedId = interaction.values[0];
  if (!selectedId) {
    await interaction.reply({ content: "No se seleccionó ningún usuario.", ephemeral: true });
    return;
  }

  const guild = interaction.guild;
  if (!guild) {
    await interaction.reply({ content: "Este comando solo funciona en un servidor.", ephemeral: true });
    return;
  }

  let member: GuildMember;
  try {
    member = await guild.members.fetch(selectedId);
  } catch {
    await interaction.update({
      embeds: [
        new EmbedBuilder()
          .setDescription("❌ No se pudo encontrar al usuario en el servidor.")
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
      { name: "🏅 Cargo", value: label, inline: true },
      { name: "👮 Promovido por", value: `<@${interaction.user.id}>`, inline: true },
    )
    .setFooter({ text: `${interaction.user.tag} • ${today}` })
    .setTimestamp();

  try {
    const channel = (await interaction.client.channels.fetch(CHANNELS.PROMOCION)) as TextChannel;
    await channel.send({ embeds: [resultEmbed] });
  } catch (err) {
    logger.error({ err }, "Error sending promotion embed to channel");
  }

  await interaction.update({
    embeds: [
      new EmbedBuilder()
        .setDescription(`✅ <@${selectedId}> ha sido ascendido a **${label}** correctamente.`)
        .setColor(EMBED_COLOR),
    ],
    components: [],
  });
}
