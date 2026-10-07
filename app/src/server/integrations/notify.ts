import "server-only";
import type { Channel } from "@prisma/client";
import { prisma } from "@/server/db";

/**
 * Notifications (WhatsApp, email, portal). The interface is what the app calls;
 * the dev implementation only writes to the OutboxMessage table, which staff can
 * read in Settings → Notifications and clients see in "Sent to you".
 * Swap `notifier` for a real provider (e.g. WhatsApp Business API + SES) later.
 */
export type Message = {
  clientId?: string | null;
  to: string;
  channel: Channel;
  template: string;
  subject?: string;
  body: string;
  sendAt?: Date;
};

export interface Notifier {
  send(msg: Message): Promise<{ id: string }>;
}

const outboxNotifier: Notifier = {
  async send(msg) {
    const row = await prisma.outboxMessage.create({
      data: {
        clientId: msg.clientId ?? null,
        toAddress: msg.to,
        channel: msg.channel,
        template: msg.template,
        subject: msg.subject,
        body: msg.body,
        sendAt: msg.sendAt,
      },
    });
    if (process.env.NODE_ENV !== "production") {
      console.info(`[outbox] ${msg.channel} → ${msg.to} · ${msg.template}\n${msg.subject ? msg.subject + "\n" : ""}${msg.body}`);
    }
    return { id: row.id };
  },
};

export const notifier: Notifier = outboxNotifier;

/** Fill {placeholders} from a template body. */
export function fill(body: string, vars: Record<string, string | number | undefined | null>) {
  return body.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`).toString());
}

/** Send by stored NotificationTemplate key on each channel the client accepts. */
export async function sendTemplate(key: string, opts: { clientId: string; vars: Record<string, string | number | undefined | null>; channels?: Channel[] }) {
  const client = await prisma.clientProfile.findUnique({ where: { id: opts.clientId }, include: { user: true } });
  if (!client) return;
  const templates = await prisma.notificationTemplate.findMany({ where: { key, ...(opts.channels ? { channel: { in: opts.channels } } : {}) } });
  for (const t of templates) {
    if (t.channel === "WHATSAPP" && !client.whatsappUpdates) continue;
    await notifier.send({
      clientId: client.id,
      to: t.channel === "EMAIL" ? client.user.email : t.channel === "WHATSAPP" ? client.mobile ?? "no mobile" : "portal",
      channel: t.channel,
      template: key,
      subject: t.subject ? fill(t.subject, opts.vars) : undefined,
      body: fill(t.body, opts.vars),
    });
  }
}
