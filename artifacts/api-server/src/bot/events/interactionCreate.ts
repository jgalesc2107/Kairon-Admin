import {
  Interaction,
  ChatInputCommandInteraction,
  ButtonInteraction,
  UserSelectMenuInteraction,
  StringSelectMenuInteraction,
  EmbedBuilder,
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
  handlePromocionSelect,
} from "../handlers/promotion.js";
import { EMBED_COLOR } from "../config.js";
import { logger } from "../../lib/logger.js";

export async function onInteractionCreate(
  interaction: Interaction,
): Promise<void> {
  try {
    // Slash commands
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
          await i.reply({
            embeds: [
              new EmbedBuilder()
                .setDescription(
                  "📬 Te he enviado un mensaje directo para iniciar el registro. Asegúrate de tener los MDs habilitados.",
                )
                .setColor(EMBED_COLOR),
            ],
            ephemeral: true,
          });
          await startRegistration(i.user.id, i.user.tag, i.client);
          break;
        }
        case "btn_promocion":
          await handlePromocionButton(i);
          break;
      }
      return;
    }

    // User select menu (promotion)
    if (interaction.isUserSelectMenu()) {
      const i = interaction as UserSelectMenuInteraction;
      if (i.customId === "select_promo_user") {
        await handlePromocionSelect(i);
      }
      return;
    }

    // String select menu (delwarn)
    if (interaction.isStringSelectMenu()) {
      const i = interaction as StringSelectMenuInteraction;
      if (i.customId.startsWith("delwarn_select_")) {
        await handleDelwarnSelect(i);
      }
      return;
    }
  } catch (err) {
    logger.error({ err }, "Error handling interaction");
    if (interaction.isRepliable() && !interaction.replied) {
      await interaction
        .reply({
          content: "❌ Ocurrió un error al procesar la interacción.",
          ephemeral: true,
        })
        .catch(() => {});
    }
  }
}
