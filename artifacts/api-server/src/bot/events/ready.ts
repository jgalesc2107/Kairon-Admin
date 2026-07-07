import { Client, REST, Routes } from "discord.js";
import { data as warnData } from "../commands/warn.js";
import { data as delwarnData } from "../commands/delwarn.js";
import { data as historialData } from "../commands/historial.js";
import { logger } from "../../lib/logger.js";

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
    await rest.put(Routes.applicationCommands(client.user.id), {
      body: commands,
    });
    logger.info("Slash commands registered globally");
  } catch (err) {
    logger.error({ err }, "Failed to register slash commands");
  }
}
