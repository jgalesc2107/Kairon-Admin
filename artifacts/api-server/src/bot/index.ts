import { Client, GatewayIntentBits, Partials } from "discord.js";
import { onReady } from "./events/ready.js";
import { onGuildMemberAdd } from "./events/guildMemberAdd.js";
import { onMessageCreate } from "./events/messageCreate.js";
import { onInteractionCreate } from "./events/interactionCreate.js";
import { logger } from "../lib/logger.js";

export function startBot(): void {
  const token = process.env["DISCORD_BOT_TOKEN"];
  if (!token) {
    logger.error("DISCORD_BOT_TOKEN not set — bot will not start");
    return;
  }

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.DirectMessages,
    ],
    partials: [Partials.Channel, Partials.Message],
  });

  client.once("ready", () => onReady(client));
  client.on("guildMemberAdd", onGuildMemberAdd);
  client.on("messageCreate", onMessageCreate);
  client.on("interactionCreate", onInteractionCreate);

  client.login(token).catch((err) => {
    logger.error({ err }, "Failed to login to Discord");
  });
}
