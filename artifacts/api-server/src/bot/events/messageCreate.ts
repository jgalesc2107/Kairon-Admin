import { EmbedBuilder, Message, PermissionFlagsBits } from "discord.js";
import { EMBED_COLOR, PANEL_COMMAND } from "../config.js";
import { buildPanelMessage } from "../handlers/panel.js";
import {
  hasActiveSession,
  handleRegistrationMessage,
} from "../handlers/registration.js";

export async function onMessageCreate(message: Message): Promise<void> {
  if (message.author.bot) return;

  // DM: check if the user has an active registration session
  if (!message.guild && hasActiveSession(message.author.id)) {
    await handleRegistrationMessage(message, message.client);
    return;
  }

  if (!message.guild || !("send" in message.channel)) return;

  // ?code — sends the server code embed
  if (message.content === "?code") {
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLOR)
      .setTitle("📋 Código del Servidor")
      .setDescription("```\n51411685-1e04-4ba4-b287-5eaf74e3d5a1\n```");
    await message.channel.send({ embeds: [embed] });
    return;
  }

  // Server text command — only members with ManageGuild permission
  if (message.content === PANEL_COMMAND) {
    const member = message.member;
    const allowed = member?.permissions.has(PermissionFlagsBits.ManageGuild);
    if (!allowed) return;
    await message.channel.send(buildPanelMessage());
  }
}
