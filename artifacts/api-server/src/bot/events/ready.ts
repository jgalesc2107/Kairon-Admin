import { Client, REST, Routes } from "discord.js";
import { data as warnData } from "../commands/warn.js";
import { data as delwarnData } from "../commands/delwarn.js";
import { data as historialData } from "../commands/historial.js";
import { logger } from "../../lib/logger.js";
import { GUILD_ID } from "../config.js";

export async function onReady(client: Client): Promise<void> {
  logger.info({ tag: client.user?.tag }, "Discord bot ready");

  const token = process.env["DISCORD_BOT_TOKEN"];
  if (!token || !client.user) return;

  const rest = new REST().setToken(token);
  const commands = [
    warnData.toJSON(),
    delwarnData.toJSON(),
    historialData.toJSON(),
  ];

  try {
    await rest.put(
      Routes.applicationGuildCommands(client.user.id, GUILD_ID),
      { body: commands }
    );
    logger.info({ guildId: GUILD_ID }, "Slash commands registered for guild");
  } catch (err) {
    logger.error({ err }, "Failed to register slash commands");
  }
}
