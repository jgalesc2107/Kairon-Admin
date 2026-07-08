import {
  Interaction,
  ChatInputCommandInteraction,
  ButtonInteraction,
  UserSelectMenuInteraction,
  StringSelectMenuInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
} from "discord.js";
import { execute as executeWarn } from "../commands/warn.js";
import {
  execute as executeDelwarn,
  handleDelwarnSelect,
} from "../commands/delwarn.js";
import { execute as executeHistorial } from "../commands/historial.js";
import { startRegistration } from "../handlers/registration.js";
import {
  handlePromocionButton,
  handlePromocionTypeSelect,
  handlePromocionSelect,
} from "../handlers/promotion.js";
import { EMBED_COLOR } from "../config.js";
import { logger } from "../../lib/logger.js";

function hasPermission(
  interaction: ButtonInteraction | UserSelectMenuInteraction | StringSelectMenuInteraction,
  flag: bigint,
): boolean {
  return interaction.memberPermissions?.has(flag) === true;
}

export async function onInteractionCreate(
  interaction: Interaction,
): Promise<void> {
  try {
    // Slash commands (permissions enforced via defaultMemberPermissions)
    if (interaction.isChatInputCommand()) {
      const i = interaction as ChatInputCommandInteraction;
      switch (i.commandName) {
        case "warn":
          await executeWarn(i);
          break;
        case "delwarn":
          await executeDelwarn(i);
          break;
        case "historial":
          await executeHistorial(i);
          break;
      }
      return;
    }

    // Buttons
    if (interaction.isButton()) {
      const i = interaction as ButtonInteraction;

      switch (i.customId) {
        case "btn_registro": {
          // Must have ModerateMembers to record events
          if (!hasPermission(i, PermissionFlagsBits.ModerateMembers)) {
            await i.reply({
              embeds: [
                new EmbedBuilder()
                  .setDescription("❌ No tienes permisos para usar esta función.")
                  .setColor(EMBED_COLOR),
              ],
              ephemeral: true,
            });
            return;
          }
          // Defer so we can check if DM succeeds before confirming
          await i.deferReply({ ephemeral: true });
          const dmOk = await startRegistration(i.user.id, i.user.tag, i.client);
          if (dmOk) {
            await i.editReply({
              embeds: [
                new EmbedBuilder()
                  .setDescription(
                    "📬 Te he enviado un mensaje directo para iniciar el registro.",
                  )
                  .setColor(EMBED_COLOR),
              ],
            });
          } else {
            await i.editReply({
              embeds: [
                new EmbedBuilder()
                  .setDescription(
                    "⚠️ No pude enviarte un mensaje directo. Activa los mensajes directos en la configuración de privacidad del servidor o ya tienes un registro en curso.",
                  )
                  .setColor(EMBED_COLOR),
              ],
            });
          }
          break;
        }

        case "btn_promocion": {
          // Must have ManageRoles to promote
          if (!hasPermission(i, PermissionFlagsBits.ManageRoles)) {
            await i.reply({
              embeds: [
                new EmbedBuilder()
                  .setDescription("❌ No tienes permisos para usar esta función.")
                  .setColor(EMBED_COLOR),
              ],
              ephemeral: true,
            });
            return;
          }
          await handlePromocionButton(i);
          break;
        }
      }
      return;
    }

    // User select menu (promotion step 3)
    if (interaction.isUserSelectMenu()) {
      const i = interaction as UserSelectMenuInteraction;
      if (i.customId.startsWith("select_promo_user")) {
        if (!hasPermission(i, PermissionFlagsBits.ManageRoles)) {
          await i.update({
            embeds: [
              new EmbedBuilder()
                .setDescription("❌ No tienes permisos para usar esta función.")
                .setColor(EMBED_COLOR),
            ],
            components: [],
          });
          return;
        }
        await handlePromocionSelect(i);
      }
      return;
    }

    // String select menus
    if (interaction.isStringSelectMenu()) {
      const i = interaction as StringSelectMenuInteraction;
      if (i.customId === "select_promo_type") {
        if (!hasPermission(i, PermissionFlagsBits.ManageRoles)) {
          await i.update({
            embeds: [
              new EmbedBuilder()
                .setDescription("❌ No tienes permisos para usar esta función.")
                .setColor(EMBED_COLOR),
            ],
            components: [],
          });
          return;
        }
        await handlePromocionTypeSelect(i);
      } else if (i.customId.startsWith("delwarn_select_")) {
        await handleDelwarnSelect(i);
      }
      return;
    }
  } catch (err) {
    logger.error({ err }, "Error handling interaction");
    if (!interaction.isRepliable()) return;
    if (interaction.deferred) {
      await interaction
        .editReply({ content: "❌ Ocurrió un error al procesar la interacción." })
        .catch(() => {});
    } else if (!interaction.replied) {
      await interaction
        .reply({ content: "❌ Ocurrió un error al procesar la interacción.", ephemeral: true })
        .catch(() => {});
    }
  }
}
