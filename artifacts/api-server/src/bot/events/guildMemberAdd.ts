import { GuildMember, EmbedBuilder, TextChannel } from "discord.js";
import {
  CHANNELS,
  EMBED_COLOR,
  THUMBNAIL_URL,
  WELCOME_BANNER_URL,
} from "../config.js";
import { logger } from "../../lib/logger.js";

export async function onGuildMemberAdd(member: GuildMember): Promise<void> {
  // Welcome message to the configured channel
  try {
    const channel = (await member.client.channels.fetch(
      CHANNELS.BIENVENIDA,
    )) as TextChannel;

    const embed = new EmbedBuilder()
      .setColor(EMBED_COLOR)
      .setDescription(
        "`👋 | Admisión`\n" +
          "> Lee el apartado de admisión en el canal <#1493142967878287371>. Una vez lo hayas leído, puedes continuar.\n\n" +
          "`✅ | Verificación`\n" +
          "> Para continuar, debes elegir tu camino. Puedes formar parte de la facción como aspirante, donde recibirás entrenamiento y participarás en eventos.\n> \n> Por otro lado, tienes la opción de civil; en este caso, no tendrás acceso al servidor como miembro de la comunidad.",
      )
      .setThumbnail(THUMBNAIL_URL)
      .setImage(WELCOME_BANNER_URL);

    await channel.send({
      content: `<@${member.id}> Bienvenido`,
      embeds: [embed],
    });
  } catch (err) {
    logger.error({ err }, "Error sending welcome message to channel");
  }

  // DM to the new member
  try {
    await member.user.send(
      `${member.user}, Bienvenido a Kairon Group!\n\nRecuerda revisar los canales correspondientes, si tienes dudas puedes consultar al personal por los canales disponibles o tickets dependiendo del caso.`,
    );
  } catch {
    // User has DMs disabled — silently skip
  }
}
