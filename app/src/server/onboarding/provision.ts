import "server-only";
import { prisma } from "@/server/db";
import { notifier } from "@/server/integrations/notify";
import { now } from "@/lib/clock";
import { provisionCore, type OrderInput } from "./provisionCore";
import { appUrl, welcomeEmail } from "./emails";
import { paidUrl } from "./tokens";

/**
 * Shopify order paid → client account. Creates User (CLIENT) + ClientProfile + Order + Invoice +
 * default AssessmentPlan (Intake, Online Capture) + a 48 h SetupToken (sha256 stored), then sends
 * "Welcome to ADITUS, set up your account" with the setup link and temporary login details.
 * Idempotent per order number.
 */
export async function provisionFromOrder(input: OrderInput) {
  const r = await provisionCore(prisma, input, { at: now() });
  const setupPath = r.rawToken ? `/setup/${r.rawToken}` : null;
  if (!r.duplicate) {
    const mail = setupPath
      ? welcomeEmail({ first: r.client.firstName, email: r.user.email, item: r.order.item, productLine: r.order.productLine, setupUrl: appUrl(setupPath), tempPassword: r.tempPassword ?? undefined, orderNumber: r.order.number })
      : { subject: `Thank you for your order ${r.order.number}`, body: `Hi ${r.client.firstName}. Thank you for your order: ${r.order.item}. It is in your account under Orders.\n\n${appUrl("/orders")}` };
    await notifier.send({ clientId: r.client.id, to: r.user.email, channel: "EMAIL", template: setupPath ? "welcome_setup" : "order_paid", subject: mail.subject, body: mail.body });
  }
  return { duplicate: r.duplicate, clientId: r.client.id, userId: r.user.id, orderNumber: r.order.number, setupPath, paidPath: paidUrl(r.order.number) };
}
