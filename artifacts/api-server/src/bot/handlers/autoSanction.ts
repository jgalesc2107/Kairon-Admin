import {
  GuildMember,
  EmbedBuilder,
  TextChannel,
  ChatInputCommandInteraction,
} from "discord.js";
import { CHANNELS, EMBED_COLOR, PROMO_ROLES } from "../config.js";
import { logger } from "../../lib/logger.js";

const MS_DAY = 24 * 60 * 60 * 1000;
const MS_3_DAYS = 3 * MS_DAY;
const MS_7_DAYS = 7 * MS_DAY;

interface SanctionResult {
  applied: boolean;
  description: string;
}

/**
 * Revisa el total de warns y aplica la medida automática si se alcanza
 * un umbral exacto (2, 4, 6 u 8).
 * Devuelve una descripción del resultado para que el caller pueda informar al moderador.
 */
export async function applyAutoSanction(
  member: GuildMember,
  warnCount: number,
  interaction: ChatInputCommandInteraction,
): Promise<string | null> {
  let result: SanctionResult | null = null;

  switch (warnCount) {
    case 2:
      result = await applyTimeout(member, MS_3_DAYS, "3 días (2 warns)");
      break;
    case 4:
      result = await applyTimeoutAndDemotion(
        member,
        MS_7_DAYS,
        "1 semana + bajada de rango (4 warns)",
      );
      break;
    case 6:
      result = await applyKick(member, "6 warns acumulados");
      break;
    case 8:
      result = await applyBan(member, "8 warns acumulados — baneo permanente");
      break;
    default:
      return null;
  }

  if (!result) return null;

  const today = new Date().toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  // DM al usuario afectado
  try {
    await member.user.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("⚠️ Sanción Automática — Kairon Systems")
          .setDescription(result.description)
          .setColor(EMBED_COLOR)
          .setFooter({ text: `Kairon Systems • ${today}` }),
      ],
    });
  } catch {
    // MD desactivados — no es crítico
  }

  // Embed al canal de sanciones
  try {
    const channel = (await interaction.client.channels.fetch(
      CHANNELS.SANCIONES,
    )) as TextChannel;
    await channel.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("🔴 Sanción Automática")
          .setDescription(
            `<@${member.id}> ha alcanzado **${warnCount} warns**.\n${result.description}`,
          )
          .setColor(EMBED_COLOR)
          .setFooter({ text: `Sistema automático • ${today}` }),
      ],
    });
  } catch (err) {
    logger.error({ err }, "Error sending auto-sanction embed");
  }

  return result.description;
}

async function applyTimeout(
  member: GuildMember,
  durationMs: number,
  label: string,
): Promise<SanctionResult> {
  try {
    await member.timeout(durationMs, label);
    const days = durationMs / MS_DAY;
    return {
      applied: true,
      description: `🔇 Has recibido un aislamiento de **${days} días** por acumular warns.`,
    };
  } catch (err) {
    logger.error({ err }, "Error applying timeout");
    return { applied: false, description: "Error al aplicar el aislamiento." };
  }
}

async function applyTimeoutAndDemotion(
  member: GuildMember,
  durationMs: number,
  label: string,
): Promise<SanctionResult> {
  const days = durationMs / MS_DAY;
  const errors: string[] = [];

  // Timeout
  try {
    await member.timeout(durationMs, label);
  } catch (err) {
    logger.error({ err }, "Error applying timeout (4 warns)");
    errors.push("aislamiento");
  }

  // Bajada de rango: quitar roles de Aspirante, devolver rol base
  try {
    for (const roleId of PROMO_ROLES.ADD) {
      if (member.roles.cache.has(roleId)) {
        await member.roles.remove(roleId);
      }
    }
    for (const roleId of PROMO_ROLES.REMOVE) {
      if (!member.roles.cache.has(roleId)) {
        await member.roles.add(roleId);
      }
    }
  } catch (err) {
    logger.error({ err }, "Error applying role demotion (4 warns)");
    errors.push("bajada de rango");
  }

  const errorNote =
    errors.length > 0 ? ` (Error al aplicar: ${errors.join(", ")})` : "";
  return {
    applied: true,
    description:
      `🔇 Has recibido un aislamiento de **${days} días** y una **bajada de rango** por acumular warns.${errorNote}`,
  };
}

async function applyKick(
  member: GuildMember,
  reason: string,
): Promise<SanctionResult> {
  try {
    await member.kick(reason);
    return {
      applied: true,
      description: "👢 Has sido **expulsado** de la facción por acumular warns.",
    };
  } catch (err) {
    logger.error({ err }, "Error applying kick");
    return { applied: false, description: "Error al aplicar la expulsión." };
  }
}

async function applyBan(
  member: GuildMember,
  reason: string,
): Promise<SanctionResult> {
  try {
    await member.ban({ reason });
    return {
      applied: true,
      description: "🔨 Has sido **baneado permanentemente** de la facción por acumular warns.",
    };
  } catch (err) {
    logger.error({ err }, "Error applying ban");
    return { applied: false, description: "Error al aplicar el baneo." };
  }
}
