import { Message, PermissionFlagsBits } from "discord.js";
import { PANEL_COMMAND } from "../config.js";
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

  // Server text command — only members with ManageGuild permission
  if (message.content === PANEL_COMMAND && message.guild) {
    const member = message.member;
    const allowed = member?.permissions.has(PermissionFlagsBits.ManageGuild);
    if (!allowed) return;
    if ("send" in message.channel) {
      await message.channel.send(buildPanelMessage());
    }
  }
}
