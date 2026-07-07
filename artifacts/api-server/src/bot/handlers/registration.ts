import {
  Client,
  EmbedBuilder,
  Message,
  TextChannel,
  AttachmentBuilder,
} from "discord.js";
import { CHANNELS, EMBED_COLOR } from "../config.js";
import { logger } from "../../lib/logger.js";

interface RegistrationSession {
  step: number;
  answers: {
    eventoNombre?: string;
    host?: string;
    coHost?: string;
    supervisor?: string;
    aprobados?: string;
    suspendidos?: string;
    descripcionGeneral?: string;
    fotoBuffer?: Buffer;
    fotoName?: string;
    fotoUrl?: string;
  };
  userId: string;
  userTag: string;
}

const sessions = new Map<string, RegistrationSession>();

const QUESTIONS = [
  "Por favor escribe el **Nombre del Evento**:",
  "Por favor escribe el nombre del **Host**:",
  "Por favor escribe el nombre del **Co-Host** (si no hay, escribe `N/A`):",
  "Por favor escribe el nombre del **Supervisor** (si no hay, escribe `N/A`):",
  "Por favor escribe los **Aprobados** (separados por coma si son varios):",
  "Por favor escribe los **Suspendidos** (si no hay, escribe `N/A`):",
  "Por favor escribe una **Descripción General** del evento:",
  "📎 Por favor adjunta la **Foto de Puntos** (envía el archivo o imagen):",
];

export function hasActiveSession(userId: string): boolean {
  return sessions.has(userId);
}

export async function startRegistration(
  userId: string,
  userTag: string,
  client: Client,
): Promise<boolean> {
  if (sessions.has(userId)) {
    const user = await client.users.fetch(userId);
    const dm = await user.createDM();
    await dm.send({
      embeds: [
        new EmbedBuilder()
          .setDescription(
            "⚠️ Ya tienes un registro en curso. Responde la pregunta pendiente en este chat o escribe `cancelar` para detenerlo.",
          )
          .setColor(EMBED_COLOR),
      ],
    });
    return false;
  }

  try {
    const user = await client.users.fetch(userId);
    const dm = await user.createDM();
    sessions.set(userId, {
      step: 0,
      answers: {},
      userId,
      userTag,
    });

    await dm.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("📋 Registro de Evento — Kairon Systems")
          .setDescription(
            "Vamos a iniciar el registro paso a paso. Responde cada pregunta aquí.\n\n" +
              QUESTIONS[0],
          )
          .setColor(EMBED_COLOR)
          .setFooter({
            text: 'Responde con un mensaje. Escribe "cancelar" para detener.',
          }),
      ],
    });
    return true;
  } catch (err) {
    logger.error({ err }, "Could not open DM for registration");
    sessions.delete(userId);
    return false;
  }
}

export async function handleRegistrationMessage(
  message: Message,
  client: Client,
): Promise<void> {
  const session = sessions.get(message.author.id);
  if (!session) return;

  const content = message.content.trim();

  if (content.toLowerCase() === "cancelar") {
    sessions.delete(message.author.id);
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setDescription("❌ Registro cancelado.")
          .setColor(EMBED_COLOR),
      ],
    });
    return;
  }

  const { step, answers } = session;

  if (step < 7) {
    // Text-based answers (steps 0–6)
    switch (step) {
      case 0:
        answers.eventoNombre = content;
        break;
      case 1:
        answers.host = content;
        break;
      case 2:
        answers.coHost = content;
        break;
      case 3:
        answers.supervisor = content;
        break;
      case 4:
        answers.aprobados = content;
        break;
      case 5:
        answers.suspendidos = content;
        break;
      case 6:
        answers.descripcionGeneral = content;
        break;
    }
    session.step++;
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setDescription(QUESTIONS[session.step])
          .setColor(EMBED_COLOR)
          .setFooter({
            text: 'Escribe "cancelar" para detener.',
          }),
      ],
    });
    return;
  }

  // Step 7: file attachment
  if (step === 7) {
    const attachment = message.attachments.first();
    if (!attachment) {
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              "⚠️ Por favor adjunta una imagen o archivo para continuar.",
            )
            .setColor(EMBED_COLOR),
        ],
      });
      return;
    }

    answers.fotoUrl = attachment.url;
    answers.fotoName = attachment.name ?? "foto_puntos.png";

    try {
      const resp = await fetch(attachment.url);
      answers.fotoBuffer = Buffer.from(await resp.arrayBuffer());
    } catch {
      // Will use URL fallback
    }

    session.step++;
    sessions.delete(message.author.id);
    await finishRegistration(
      answers as Required<typeof answers>,
      session.userId,
      session.userTag,
      client,
      message,
    );
  }
}

async function finishRegistration(
  answers: RegistrationSession["answers"],
  userId: string,
  userTag: string,
  client: Client,
  dmMessage: Message,
): Promise<void> {
  const today = new Date().toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const embed = new EmbedBuilder()
    .setTitle("📋 Registro de Evento")
    .setColor(EMBED_COLOR)
    .addFields(
      {
        name: "📌 Nombre del Evento",
        value: answers.eventoNombre ?? "N/A",
        inline: false,
      },
      { name: "👤 Host", value: answers.host ?? "N/A", inline: true },
      { name: "👥 Co-Host", value: answers.coHost ?? "N/A", inline: true },
      {
        name: "🔍 Supervisor",
        value: answers.supervisor ?? "N/A",
        inline: true,
      },
      {
        name: "✅ Aprobados",
        value: answers.aprobados ?? "N/A",
        inline: false,
      },
      {
        name: "❌ Suspendidos",
        value: answers.suspendidos ?? "N/A",
        inline: false,
      },
      {
        name: "📝 Descripción General",
        value: (answers.descripcionGeneral ?? "N/A").slice(0, 1000),
        inline: false,
      },
    )
    .setFooter({ text: `Registrado por ${userTag} • ${today}` });

  type MessagePayload = {
    embeds: EmbedBuilder[];
    files?: AttachmentBuilder[];
  };

  const payload: MessagePayload = { embeds: [embed] };

  if (answers.fotoBuffer && answers.fotoName) {
    const file = new AttachmentBuilder(answers.fotoBuffer, {
      name: answers.fotoName,
    });
    embed.setImage(`attachment://${answers.fotoName}`);
    payload.files = [file];
  } else if (answers.fotoUrl) {
    embed.setImage(answers.fotoUrl);
  }

  try {
    const channel = (await client.channels.fetch(
      CHANNELS.REGISTRO,
    )) as TextChannel;
    await channel.send(payload);

    await dmMessage.reply({
      embeds: [
        new EmbedBuilder()
          .setDescription("✅ ¡Registro completado y enviado correctamente!")
          .setColor(EMBED_COLOR),
      ],
    });
  } catch (err) {
    logger.error({ err }, "Error sending registration result to channel");
    await dmMessage.reply({
      embeds: [
        new EmbedBuilder()
          .setDescription(
            "❌ Hubo un error al enviar el registro. Contacta a un administrador.",
          )
          .setColor(EMBED_COLOR),
      ],
    });
  }
}
