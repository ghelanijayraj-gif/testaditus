import type { Channel, ConsentKind, DocumentType, HealthProvider, Prisma, PrismaClient, SystemKey } from "@prisma/client";
import { d, type Base } from "../base";
import { METRICS, SOURCES, seriesValue } from "../../../src/components/client/records/catalog";

/**
 * Records area seed (05 My plan, Health data, Documents, Orders, Account, Export, Access ended).
 * Ananya Iyer is the training sample: 05's data ported from "Aarav" to "Ananya". All data fictional.
 * Rohan: expiring plan, basic orders, Garmin sync error. Farah: grace period with an export ready.
 * Omar: access ended, exported. Sana (choose your path) and Aarav (locked) need nothing here.
 */
const MB = 1024 * 1024;
const TODAY = "2026-10-07";

export default async function seedRecords(db: PrismaClient, base: Base) {
  const { jayraj, shimyu, tic } = base;
  const byEmail = (email: string) => db.clientProfile.findFirst({ where: { user: { email } }, include: { user: true } });
  const product = (slug: string) => db.product.findUnique({ where: { slug } });

  // 05 "Choose your path" shows Personal Training · 24 sessions · 90 days. Base mirrors pt-12 and group-24 only.
  if (!(await product("pt-24"))) {
    await db.product.create({ data: { slug: "pt-24", name: "Personal Training", kind: "PERSONAL_TRAINING", priceLabel: "₹XX,XXX", sessions: 24, validityDays: 90, shopifyProductId: "gid://shopify/Product/pt-24" } });
  }
  const pt12 = (await product("pt-12"))!;
  const group24 = (await product("group-24"))!;

  /** The plan may already exist (Shell/lifecycle seed); create it only when missing, then add the program summary. */
  const ensurePlan = async (clientId: string, data: Omit<Prisma.ClientPlanUncheckedCreateInput, "clientId">) => {
    const found = await db.clientPlan.findFirst({ where: { clientId, productId: data.productId, startsAt: { lte: new Date((data.startsAt as Date).getTime() + 86_400_000 * 3) } }, orderBy: { startsAt: "desc" } });
    if (!found) return db.clientPlan.create({ data: { clientId, ...data } });
    return db.clientPlan.update({ where: { id: found.id }, data: { goal: found.goal ?? data.goal, currentPhase: found.currentPhase ?? data.currentPhase, perWeek: found.perWeek ?? data.perWeek, focusAreas: found.focusAreas.length ? found.focusAreas : data.focusAreas, coachId: found.coachId ?? data.coachId } });
  };

  const consents = async (clientId: string, given: Partial<Record<ConsentKind, boolean>>, at: string) => {
    for (const [kind, granted] of Object.entries(given) as [ConsentKind, boolean][]) {
      await db.consent.upsert({ where: { clientId_kind: { clientId, kind } }, update: { granted }, create: { clientId, kind, granted, source: "setup", changedAt: d(at) } });
      await db.consentEvent.create({ data: { clientId, kind, granted, source: "setup", createdAt: d(at) } });
    }
  };

  const samples = async (clientId: string, provider: HealthProvider, metricIds: string[]) => {
    const today = d(TODAY).getTime();
    const data: Prisma.HealthSampleCreateManyInput[] = [];
    for (const id of metricIds) {
      const m = METRICS.find((x) => x.id === id)!;
      for (let i = 0; i < 90; i++) data.push({ clientId, provider, metric: id, date: new Date(today - (89 - i) * 86_400_000), value: Number(seriesValue(m, i).toFixed(3)) });
    }
    await db.healthSample.createMany({ data });
  };
  const source = async (clientId: string, provider: HealthProvider, status: "CONNECTED" | "ERROR", lastSync: string, shared?: string[]) => {
    const def = SOURCES.find((s) => s.provider === provider)!;
    await db.healthSource.upsert({
      where: { clientId_provider: { clientId, provider } },
      update: { status, lastSyncAt: d(lastSync), dataTypes: def.types, sharedWithCoach: shared ?? def.types },
      create: { clientId, provider, status, lastSyncAt: d(lastSync), dataTypes: def.types, sharedWithCoach: shared ?? def.types },
    });
    await samples(clientId, provider, def.metrics);
  };

  type Doc = { key: string; title: string; type: DocumentType; source: "CLIENT" | "ADITUS"; testDate: string; added: string; filename: string; measure?: string; system?: SystemKey; size: number; values?: [string, string, string][] };
  const documents = async (clientId: string, uploader: string, docs: Doc[]) => {
    const out: Record<string, string> = {};
    for (const x of docs) {
      const row = await db.document.create({
        data: {
          clientId, source: x.source, type: x.type, title: x.title, filename: x.filename, sizeBytes: Math.round(x.size * MB),
          testDate: d(x.testDate), createdAt: d(x.added), linkedMeasureKey: x.measure ?? null, linkedSystem: x.system ?? null,
          uploadedByName: x.source === "CLIENT" ? uploader : "Shimyu",
          recordedValues: x.values ? x.values.map(([name, value, unit]) => ({ name, value, unit })) : undefined,
        },
      });
      out[x.key] = row.id;
    }
    return out;
  };

  const sent = async (clientId: string, email: string, mobile: string, items: { at: string; title: string; channels: Channel[]; doc?: string; template: string }[]) => {
    for (const it of items) {
      for (const channel of it.channels) {
        const m = await db.outboxMessage.create({
          data: { clientId, channel, toAddress: channel === "EMAIL" ? email : channel === "WHATSAPP" ? mobile : "portal", template: it.template, subject: it.title, body: `${it.title}. Open it in your ADITUS portal.`, status: "SENT", createdAt: d(it.at) },
        });
        await db.outboxDocument.create({ data: { messageId: m.id, documentId: it.doc ?? "", title: it.title } });
      }
    }
  };

  const ledger = async (clientId: string, orders: [string, string, string, string, string][], invoices: [string, string, string, string, "PAID" | "DUE" | "OVERDUE"][]) => {
    for (const [number, item, amountLabel, at, paymentMethod] of orders) {
      if (await db.order.findUnique({ where: { number } })) continue;
      await db.order.create({ data: { number, clientId, item, amountLabel, placedAt: d(at), paymentMethod, shopifyId: "gid://shopify/Order/" + number.replace(/\D/g, "") } });
    }
    for (const [number, item, amountLabel, at, status] of invoices) {
      if (await db.invoice.findUnique({ where: { number } })) continue;
      await db.invoice.create({ data: { number, clientId, item, amountLabel, issuedAt: d(at), status } });
    }
  };

  // ───────────────────────── Ananya Iyer (training sample) ─────────────────────────
  const ananya = await byEmail("ananya@example.com");
  if (ananya) {
    const id = ananya.id;
    if (!ananya.dateOfBirth) {
      await db.clientProfile.update({ where: { id }, data: { mobile: "+91 98765 43210", dateOfBirth: d("1992-06-21"), emergencyName: "Kiran Iyer, brother", emergencyPhone: "+91 98111 22334" } });
    }
    await db.clientCoach.createMany({ data: [{ clientId: id, staffId: jayraj.id, role: "BREATH" }], skipDuplicates: true });

    await ensurePlan(id, {
      productId: pt12.id, name: "Personal Training · 12 sessions", startsAt: d("2026-09-14 07:00"), endsAt: d("2026-10-29 23:59"), sessionsTotal: 12, sessionsUsed: 7, coachId: shimyu.id, status: "ACTIVE",
      goal: "Squat to full depth and trek without right knee pain.", currentPhase: "Phase 2 of 3 · Load the new range", perWeek: "2 Personal Training · 1 optional class",
      focusAreas: ["Right hip turns in less than the left", "Right leg balance", "Lower ribs barely move", "Short sleep on weeknights"],
    });
    if (!(await db.clientPlan.findFirst({ where: { clientId: id, name: "Mobility Lab · 4 class pass" } }))) {
      await db.clientPlan.create({ data: { clientId: id, productId: group24.id, name: "Mobility Lab · 4 class pass", startsAt: d("2026-08-01 08:00"), endsAt: d("2026-09-30 23:59"), sessionsTotal: 4, sessionsUsed: 3, status: "EXPIRED" } });
    }

    const holdings: [string, string, string][] = [
      ["Mobility Lab · 4 class pass", "2 of 4 used · Saturdays 8:00 AM", "Active"],
      ["Breath session · online", "1 of 2 used", "Active"],
      ["Run and Plunge", "Community event · free for clients", "Booked"],
      ["Toe spacers", "Shopify · bought 12 Sep", "Owned"],
      ["Fascia ball", "Shopify · bought 12 Sep", "Owned"],
    ];
    await db.productHolding.createMany({ data: holdings.map(([title, detail, status], order) => ({ clientId: id, title, detail, status, order })) });

    const report = await db.report.findFirst({ where: { clientId: id, kind: "BASELINE" }, include: { findings: true } });
    const sugg: [string, string, string, string][] = [
      ["Breath sessions · 4 class pack", "Your breath hold is 16 s. Breath sessions work on this directly.", "Online or at TIC · 45 minutes each", "hold"],
      ["Heat and Cold · 2 visits", "You rate recovery after training 5 of 10. Some clients use this between sessions.", "TIC Kandivali · 40 minutes", "selfrec"],
    ];
    for (const [i, [name, reason, meta, testKey]] of sugg.entries()) {
      const s = await db.productSuggestion.create({ data: { clientId: id, name, reason } });
      const finding = report?.findings.find((f) => f.measureKeys.includes(testKey) || (testKey === "hold" && f.system === "BREATH") || (testKey === "selfrec" && f.system === "RECOVERY"));
      await db.suggestionDetail.create({ data: { suggestionId: s.id, meta, testKey, findingId: finding?.id ?? null, order: i } });
    }

    await consents(id, { HEALTH_DOCUMENTS: true, PHOTOS_VIDEOS: true, HEALTH_APP_SYNC: true, TESTIMONIAL: false, COMMUNITY: true, ASSESSMENT_AGREEMENT: true, ASSESSMENT_MEDIA: true }, "2026-08-28 19:30");

    await source(id, "APPLE_HEALTH", "CONNECTED", `${TODAY} 06:40`);
    const notes: [SystemKey, string][] = [
      ["MOVEMENT", "I watch your step count on non session days. Under 5,000 and I keep the next session lighter on the legs."],
      ["BREATH", "Your sleeping breath rate has come down since baseline. It tells me the daily breathing practice is landing."],
      ["RECOVERY", "I use resting heart rate and sleep to set session load. Two short nights in a row and we swap heavy squats for mobility."],
      ["PERFORMANCE", "Estimated VO2 max moves slowly. I check it monthly against your 1 km run, not week to week."],
    ];
    for (const [system, text] of notes) await db.coachNote.create({ data: { clientId: id, system, scope: "health", text, coachName: "Shimyu", updatedAt: d("2026-10-01 18:00") } });

    const docs = await documents(id, "Ananya Iyer", [
      { key: "d1", title: "Blood test, full panel", type: "BLOOD_TEST", source: "CLIENT", testDate: "2026-08-18", added: "2026-08-28 20:10", filename: "Blood test, full panel.pdf", measure: "rhr", system: "RECOVERY", size: 1.4,
        values: [["Haemoglobin", "14.2", "g/dL"], ["Vitamin D, 25 OH", "18", "ng/mL"], ["Vitamin B12", "310", "pg/mL"], ["Fasting glucose", "92", "mg/dL"], ["HbA1c", "5.4", "%"], ["TSH", "2.1", "µIU/mL"]] },
      { key: "d2", title: "Right knee X ray", type: "XRAY", source: "CLIENT", testDate: "2026-07-22", added: "2026-08-28 20:14", filename: "Right knee X ray.jpg", measure: "knee", system: "MOVEMENT", size: 3.1 },
      { key: "d3", title: "Baseline assessment report", type: "ASSESSMENT_REPORT", source: "ADITUS", testDate: "2026-09-05", added: "2026-09-05 11:00", filename: "Baseline assessment report.pdf", measure: "all", size: 6.2 },
      { key: "d4", title: "Baseline photos, front, back, side", type: "PROGRESS_PHOTO", source: "ADITUS", testDate: "2026-09-02", added: "2026-09-02 10:30", filename: "Baseline photos.jpg", measure: "hipIR", system: "MOVEMENT", size: 8.4 },
      { key: "d5", title: "Deep squat video, baseline", type: "PROGRESS_VIDEO", source: "ADITUS", testDate: "2026-09-02", added: "2026-09-02 10:32", filename: "Deep squat video, baseline.mp4", measure: "squat", system: "MOVEMENT", size: 14.6 },
      { key: "d6", title: "Breath and rib tape sheet", type: "ASSESSMENT_REPORT", source: "ADITUS", testDate: "2026-09-02", added: "2026-09-02 10:40", filename: "Breath and rib tape sheet.pdf", measure: "ribs", system: "BREATH", size: 0.6 },
      { key: "d7", title: "Invoice INV 2026 0142", type: "INVOICE", source: "ADITUS", testDate: "2026-08-28", added: "2026-08-28 19:20", filename: "Invoice INV 2026 0142.pdf", size: 0.2 },
      { key: "d8", title: "Signed consents", type: "CONSENT", source: "ADITUS", testDate: "2026-08-28", added: "2026-08-28 19:32", filename: "Signed consents.pdf", size: 0.3 },
    ]);
    const view = (who: typeof shimyu, name: string, doc: string, title: string, at: string) =>
      db.accessLog.create({ data: { clientId: id, actorUserId: who.userId, actorName: name, resourceType: "document", resourceId: docs[doc], resourceName: title, action: "VIEWED", createdAt: d(at) } });
    await view(shimyu, "Coach Shimyu", "d1", "Blood test, full panel", "2026-10-06 18:20");
    await view(jayraj, "Coach Jayraj", "d1", "Blood test, full panel", "2026-09-01 19:05");
    await view(shimyu, "Coach Shimyu", "d2", "Right knee X ray", "2026-09-06 08:10");
    await view(jayraj, "Coach Jayraj", "d2", "Right knee X ray", "2026-09-01 19:08");
    for (const [doc, at] of [["d3", "2026-09-05 19:40"], ["d4", "2026-09-03 08:15"], ["d5", "2026-09-03 08:16"], ["d6", "2026-09-03 08:20"], ["d7", "2026-08-28 19:40"], ["d8", "2026-08-28 19:41"]] as const) {
      await db.documentView.create({ data: { clientId: id, documentId: docs[doc], createdAt: d(at) } });
    }

    await sent(id, ananya.user.email, "+91 98765 43210", [
      { at: "2026-09-05 11:00", title: "Baseline assessment report", channels: ["PORTAL", "WHATSAPP"], doc: docs.d3, template: "report_ready" },
      { at: "2026-09-02 10:35", title: "Baseline photos and squat video", channels: ["PORTAL"], doc: docs.d4, template: "document_shared" },
      { at: "2026-09-02 10:41", title: "Breath and rib tape sheet", channels: ["PORTAL"], doc: docs.d6, template: "document_shared" },
      { at: "2026-08-28 19:20", title: "Invoice INV 2026 0142", channels: ["EMAIL", "PORTAL"], doc: docs.d7, template: "invoice" },
      { at: "2026-08-28 19:32", title: "Signed consents copy", channels: ["EMAIL"], doc: docs.d8, template: "consents_copy" },
      { at: "2026-08-28 19:05", title: "Welcome email and setup link", channels: ["EMAIL"], template: "welcome" },
    ]);

    await ledger(
      id,
      [
        ["#ADT4402", "Personal Training · Assessment + 12 sessions", "₹XX,XXX", "2026-08-28 19:15", "UPI"],
        ["#ADT4436", "Toe spacers, fascia ball", "₹X,XXX", "2026-09-12 13:40", "Card"],
      ],
      [
        ["INV 2026 0142", "Personal Training · Assessment + 12 sessions", "₹XX,XXX", "2026-08-28 19:20", "PAID"],
        ["INV 2026 0151", "Heat and Cold · 2 visits", "₹X,XXX", "2026-09-15 18:00", "OVERDUE"],
        ["INV 2026 0188", "Breath Session · 4 classes", "₹X,XXX", "2026-10-01 18:00", "DUE"],
      ],
    );
  }

  // ───────────────────────── Rohan Desai (plan expiring) ─────────────────────────
  const rohan = await byEmail("rohan@example.com");
  if (rohan) {
    const id = rohan.id;
    await ensurePlan(id, {
      productId: pt12.id, name: "Personal Training · 12 sessions", startsAt: d("2026-08-28 07:00"), endsAt: d("2026-10-12 23:59"), sessionsTotal: 12, sessionsUsed: 10, coachId: shimyu.id, status: "EXPIRING_SOON",
      goal: "Run a half marathon without calf tightness.", currentPhase: "Phase 3 of 3 · Hold the new range under load", perWeek: "2 Personal Training",
      focusAreas: ["Left ankle bends less than the right", "Breath hold after exhale", "Bedtime moves through the week"],
    });
    await consents(id, { HEALTH_DOCUMENTS: true, PHOTOS_VIDEOS: true, HEALTH_APP_SYNC: true, TESTIMONIAL: false, COMMUNITY: false }, "2026-08-20 18:00");
    await source(id, "APPLE_HEALTH", "CONNECTED", `${TODAY} 06:10`);
    await source(id, "GARMIN", "ERROR", "2026-10-02 21:14", ["Workouts and pace"]);
    await ledger(id, [["#ADT4389", "Personal Training · Assessment + 12 sessions", "₹XX,XXX", "2026-08-20 17:50", "UPI"]], [["INV 2026 0133", "Personal Training · Assessment + 12 sessions", "₹XX,XXX", "2026-08-20 17:55", "PAID"]]);
    await documents(id, "Rohan Desai", [{ key: "r1", title: "Physio notes, calf", type: "PHYSIO_NOTE", source: "CLIENT", testDate: "2026-07-30", added: "2026-08-21 21:00", filename: "Physio notes, calf.pdf", measure: "ankle", system: "MOVEMENT", size: 0.9 }]);
  }

  // ───────────────────────── Farah Ali (grace period, export ready) ─────────────────────────
  const farah = await byEmail("farah@example.com");
  if (farah) {
    const id = farah.id;
    await db.clientProfile.update({ where: { id }, data: { graceEndsAt: d("2026-10-28 23:59"), accessEndsAt: d("2026-10-28 23:59") } });
    await ensurePlan(id, { productId: pt12.id, name: "Personal Training · 12 sessions", startsAt: d("2026-07-06 07:00"), endsAt: d("2026-09-30 23:59"), sessionsTotal: 12, sessionsUsed: 12, coachId: shimyu.id, status: "EXPIRED", renewalDecision: "declined", goal: "Return to tennis without shoulder pain.", currentPhase: "Phase 3 of 3 · Complete", perWeek: "2 Personal Training" });
    await consents(id, { HEALTH_DOCUMENTS: true, PHOTOS_VIDEOS: true, HEALTH_APP_SYNC: false, TESTIMONIAL: true, COMMUNITY: true }, "2026-03-02 18:00");
    const docs = await documents(id, "Farah Ali", [
      { key: "f1", title: "Shoulder MRI report", type: "MRI", source: "CLIENT", testDate: "2026-02-11", added: "2026-03-02 20:00", filename: "Shoulder MRI report.pdf", measure: "overhead", system: "MOVEMENT", size: 2.2 },
      { key: "f2", title: "Blood test, vitamin panel", type: "BLOOD_TEST", source: "CLIENT", testDate: "2026-02-20", added: "2026-03-02 20:04", filename: "Blood test, vitamin panel.pdf", system: "RECOVERY", size: 0.8, values: [["Vitamin D, 25 OH", "24", "ng/mL"], ["Vitamin B12", "402", "pg/mL"], ["Haemoglobin", "12.9", "g/dL"]] },
      { key: "f3", title: "Baseline assessment report", type: "ASSESSMENT_REPORT", source: "ADITUS", testDate: "2026-03-09", added: "2026-03-09 11:00", filename: "Baseline assessment report.pdf", measure: "all", size: 6.0 },
      { key: "f4", title: "Reassessment report", type: "REASSESSMENT_REPORT", source: "ADITUS", testDate: "2026-09-26", added: "2026-09-26 11:00", filename: "Reassessment report.pdf", measure: "all", size: 6.4 },
      { key: "f5", title: "Baseline photos, front, back, side", type: "PROGRESS_PHOTO", source: "ADITUS", testDate: "2026-03-06", added: "2026-03-06 10:30", filename: "Baseline photos.jpg", system: "MOVEMENT", size: 8.0 },
      { key: "f6", title: "Signed consents", type: "CONSENT", source: "ADITUS", testDate: "2026-03-02", added: "2026-03-02 18:05", filename: "Signed consents.pdf", size: 0.3 },
    ]);
    await ledger(
      id,
      [["#ADT4211", "Personal Training · Assessment + 12 sessions", "₹XX,XXX", "2026-03-01 12:00", "Card"]],
      [
        ["INV 2026 0061", "Personal Training · Assessment + 12 sessions", "₹XX,XXX", "2026-03-01 12:05", "PAID"],
        ["INV 2026 0102", "Reassessment", "₹X,XXX", "2026-06-01 12:05", "PAID"],
        ["INV 2026 0139", "Personal Training · 12 sessions", "₹XX,XXX", "2026-07-06 09:00", "PAID"],
        ["INV 2026 0177", "Reassessment 2", "₹X,XXX", "2026-09-20 12:05", "PAID"],
      ],
    );
    const items = [
      { key: "baseline", t: "Assessment report, baseline", d: "Includes body highlights · 9 Mar 2026", files: [{ label: "Baseline assessment report", href: `/api/files/${docs.f3}?download=1` }] },
      { key: "reassessment", t: "Reassessment report", d: "Includes body highlights · 26 Sep 2026", files: [{ label: "Reassessment report", href: `/api/files/${docs.f4}?download=1` }] },
      { key: "compare", t: "Compare summary", d: "All four systems · 26 Sep 2026", files: [] },
      { key: "reports", t: "All other reports", d: "1 file", files: [] },
      { key: "mine", t: "Documents you added", d: "Shoulder MRI report, Blood test", files: [{ label: "Shoulder MRI report", href: `/api/files/${docs.f1}?download=1` }, { label: "Blood test, vitamin panel", href: `/api/files/${docs.f2}?download=1` }] },
      { key: "media", t: "Progress photos and videos", d: "Baseline and reassessment", files: [{ label: "Baseline photos, front, back, side", href: `/api/files/${docs.f5}?download=1` }] },
      { key: "invoices", t: "Invoices", d: "4 GST invoices", files: ["INV 2026 0061", "INV 2026 0102", "INV 2026 0139", "INV 2026 0177"].map((n) => ({ label: n, href: `/orders/${encodeURIComponent(n)}/invoice` })) },
      { key: "consents", t: "Signed consents", d: "2 Mar 2026", files: [{ label: "Signed consents", href: `/api/files/${docs.f6}?download=1` }] },
    ];
    await db.exportPackage.create({ data: { clientId: id, status: "ready", items, fileCount: 14, sizeBytes: 38 * MB, preparedAt: d("2026-10-03 10:00") } });
    await db.dataRequest.create({ data: { clientId: id, kind: "export", status: "done", createdAt: d("2026-10-03 09:55") } });
    await sent(id, farah.user.email, "+91 98XXX XXXXX", [{ at: "2026-10-03 10:00", title: "Your export is ready", channels: ["EMAIL", "PORTAL"], template: "export_ready" }]);
  }

  // ───────────────────────── Ishita Rao and Omar Sheikh: 05 document set (titles verbatim for Results evidence) ─────────────────────────
  const set05 = (baseAt: string, reportAt: string, reAt?: string): Doc[] => [
    { key: "d1", title: "Blood test, full panel", type: "BLOOD_TEST", source: "CLIENT", testDate: "2026-04-18", added: "2026-05-02 20:10", filename: "Blood test, full panel.pdf", measure: "rhr", system: "RECOVERY", size: 1.3, values: [["Haemoglobin", "13.1", "g/dL"], ["Vitamin D, 25 OH", "22", "ng/mL"], ["HbA1c", "5.2", "%"]] },
    { key: "d2", title: "Right knee X ray", type: "XRAY", source: "CLIENT", testDate: "2026-03-22", added: "2026-05-02 20:14", filename: "Right knee X ray.jpg", measure: "knee", system: "MOVEMENT", size: 2.9 },
    { key: "d3", title: "Baseline assessment report", type: "ASSESSMENT_REPORT", source: "ADITUS", testDate: reportAt, added: `${reportAt} 11:00`, filename: "Baseline assessment report.pdf", measure: "all", size: 6.1 },
    { key: "d4", title: "Baseline photos, front, back, side", type: "PROGRESS_PHOTO", source: "ADITUS", testDate: baseAt, added: `${baseAt} 10:30`, filename: "Baseline photos.jpg", measure: "hipIR", system: "MOVEMENT", size: 8.2 },
    { key: "d5", title: "Deep squat video, baseline", type: "PROGRESS_VIDEO", source: "ADITUS", testDate: baseAt, added: `${baseAt} 10:32`, filename: "Deep squat video, baseline.mp4", measure: "squat", system: "MOVEMENT", size: 13.9 },
    { key: "d6", title: "Breath and rib tape sheet", type: "ASSESSMENT_REPORT", source: "ADITUS", testDate: baseAt, added: `${baseAt} 10:40`, filename: "Breath and rib tape sheet.pdf", measure: "ribs", system: "BREATH", size: 0.6 },
    ...(reAt ? [{ key: "d9", title: "Reassessment report", type: "REASSESSMENT_REPORT" as DocumentType, source: "ADITUS" as const, testDate: reAt, added: `${reAt} 11:00`, filename: "Reassessment report.pdf", measure: "all", size: 6.5 }] : []),
  ];
  const ishita = await byEmail("ishita@example.com");
  if (ishita) await documents(ishita.id, "Ishita Rao", set05("2026-06-06", "2026-06-09", "2026-10-05"));

  // ───────────────────────── Omar Sheikh (access ended) ─────────────────────────
  const omar = await byEmail("omar@example.com");
  if (omar) {
    const id = omar.id;
    await documents(id, "Omar Sheikh", set05("2026-05-30", "2026-06-02", "2026-08-25"));
    await db.clientProfile.update({ where: { id }, data: { graceEndsAt: d("2026-10-01 23:59"), accessEndsAt: d("2026-10-01 23:59"), exportedAt: d("2026-09-03 10:00") } });
    await ensurePlan(id, { productId: pt12.id, name: "Personal Training · 12 sessions", startsAt: d("2026-06-01 07:00"), endsAt: d("2026-08-31 23:59"), sessionsTotal: 12, sessionsUsed: 12, coachId: shimyu.id, status: "EXPIRED", renewalDecision: "declined" });
    await ledger(id, [["#ADT4150", "Personal Training · Assessment + 12 sessions", "₹XX,XXX", "2026-05-20 12:00", "UPI"]], [["INV 2026 0044", "Personal Training · Assessment + 12 sessions", "₹XX,XXX", "2026-05-20 12:05", "PAID"]]);
    await db.exportPackage.create({ data: { clientId: id, status: "ready", items: [], fileCount: 11, sizeBytes: 29 * MB, preparedAt: d("2026-09-03 10:00") } });
  }

  void tic;
}
