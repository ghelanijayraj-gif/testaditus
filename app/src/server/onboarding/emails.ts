// Transactional copy for Access (01) and Intake (03). Same content as the designed screens.

export const HELP_LINE = "+91 98200 41700";
const FOOTER = `Questions? WhatsApp us on ${HELP_LINE}\nADITUS · TIC Kandivali · Samyah Borivali · Mumbai`;

export function appUrl(path: string) {
  const base = (process.env.APP_URL ?? process.env.AUTH_URL ?? "http://localhost:3100").replace(/\/$/, "");
  return base + path;
}

/** "Welcome to ADITUS, set up your account" — the login details email from the Shopify paid webhook. */
export function welcomeEmail(p: { first: string; email: string; item: string; productLine?: string | null; setupUrl: string; tempPassword?: string; orderNumber: string }) {
  const bought = p.productLine ? `${p.item}: ${p.productLine}` : p.item;
  const body = [
    `Hi ${p.first}. Your assessment starts here.`,
    `You bought ${bought}. Order ${p.orderNumber}.`,
    `Set up your account to book your assessment and track every session.`,
    `SET UP MY ACCOUNT →\n${p.setupUrl}`,
    `This link is unique to you. It works once and expires in 48 hours.`,
    p.tempPassword
      ? `Your ADITUS login details\nEmail: ${p.email}\nTemporary password: ${p.tempPassword}\nIt works once and expires in 48 hours. You choose how to sign in during setup.`
      : null,
    FOOTER,
  ]
    .filter(Boolean)
    .join("\n\n");
  return { subject: "Welcome to ADITUS, set up your account", body };
}

export function intakeCompleteStaffEmail(p: { clientName: string; flags: number }) {
  return {
    subject: `${p.clientName} finished their intake`,
    body: `${p.clientName} finished their intake. ${p.flags ? `Safety check: ${p.flags} ${p.flags === 1 ? "item" : "items"} to discuss before testing.` : "Safety check: nothing to discuss."}\n\nOpen the client file → Intake.`,
  };
}
