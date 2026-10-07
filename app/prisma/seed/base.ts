import type { Prisma, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

/** IST timestamp helper: d("2026-10-08 07:30") */
export const d = (s: string) => {
  const [date, time = "00:00"] = s.split(" ");
  return new Date(`${date}T${time}:00+05:30`);
};

export async function seedBase(db: PrismaClient) {
  // ── Centres ──
  const tic = await db.centre.create({
    data: { slug: "tic-kandivali", name: "TIC Kandivali", area: "Thakur Village, Kandivali East", address: "Address placeholder, Thakur Village, Kandivali East, Mumbai 400101", directionsUrl: "https://maps.google.com/?q=TIC+Kandivali", entryNote: "Enter from the side gate. Ask for the ADITUS floor at reception.", hoursLabel: "Mon to Sat, 6:30 AM to 9:00 PM", rooms: 4 },
  });
  const samyah = await db.centre.create({
    data: { slug: "samyah-borivali", name: "Samyah Borivali", area: "IC Colony, Borivali West", address: "Address placeholder, IC Colony, Borivali West, Mumbai 400103", directionsUrl: "https://maps.google.com/?q=Samyah+Borivali", entryNote: "First floor, studio 2.", hoursLabel: "Mon to Sat, 7:00 AM to 8:00 PM", rooms: 3 },
  });

  // ── Staff (invite only). TOTP secrets are fixed in dev so the code can be shown on the verify screen. ──
  const staff = async (email: string, name: string, role: Prisma.StaffProfileCreateWithoutUserInput["role"], extra: Omit<Prisma.StaffProfileCreateWithoutUserInput, "role">, centres: string[]) => {
    const u = await db.user.create({
      data: { email, name, kind: "STAFF", emailVerified: new Date(), totpSecret: "JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP", staff: { create: { role, ...extra, centres: { create: centres.map((centreId) => ({ centreId })) } } } },
      include: { staff: true },
    });
    return u.staff!;
  };
  const jayraj = await staff("jayraj@aditus.in", "Jayraj", "FOUNDER", { title: "Founder · Practitioner", segment: "Assessment", availability: "Mon to Sat · 7 to 11 AM, 5 to 8 PM", yearsCoaching: "XX years", credentials: "Certifications placeholder", specialities: "Assessment, movement", shownToClients: true }, [tic.id]);
  const shimyu = await staff("shimyu@aditus.in", "Shimyu", "HOD", { title: "Head of Personal Training", segment: "Personal Training", availability: "Mon to Fri · 6:30 to 10 AM", yearsCoaching: "XX years", credentials: "Strength and conditioning", specialities: "Strength, return to running", shownToClients: true }, [tic.id, samyah.id]);
  const sahil = await staff("sahil@aditus.in", "Sahil", "OPS", { title: "Ops admin", availability: "Mon to Sat", shownToClients: false }, [tic.id, samyah.id]);
  const arjun = await staff("arjun@aditus.in", "Arjun", "FINANCE", { title: "Finance", availability: "Mon to Fri", shownToClients: false }, [tic.id, samyah.id]);

  // ── Test bank (practitioner editable) ──
  type T = [string, Prisma.TestDefinitionCreateInput["system"], string, string, string, Prisma.TestDefinitionCreateInput["inputType"], Prisma.TestDefinitionCreateInput["direction"], Prisma.TestDefinitionCreateInput["tag"], Prisma.TestDefinitionCreateInput["availability"], string[]?, Partial<Prisma.TestDefinitionCreateInput>?];
  const bank: T[] = [
    ["hipIR", "MOVEMENT", "Hip internal rotation", "Seated, knees at 90°. Inclinometer on the shin. Rotate the foot out until the pelvis lifts. Read the angle.", "°", "LR_PAIR", "HIGHER_BETTER", "MEASURED", "BOTH", [], { sided: true, flagDiff: 8, onlineTag: "OBSERVED" }],
    ["hipER", "MOVEMENT", "Hip external rotation", "Seated, knees at 90°. Rotate the foot in until the pelvis lifts. Read the angle.", "°", "LR_PAIR", "HIGHER_BETTER", "MEASURED", "BOTH", [], { sided: true, flagDiff: 8, onlineTag: "OBSERVED" }],
    ["ankle", "MOVEMENT", "Ankle dorsiflexion", "Knee to wall, heel down. Inclinometer on the shin at the end point.", "°", "LR_PAIR", "HIGHER_BETTER", "MEASURED", "BOTH", [], { sided: true, flagDiff: 8, onlineTag: "OBSERVED" }],
    ["tspine", "MOVEMENT", "Upper back rotation", "Seated, hips locked with a block between the knees. Rotate, measure at the shoulders.", "°", "LR_PAIR", "HIGHER_BETTER", "MEASURED", "BOTH", [], { sided: true, flagDiff: 8, onlineTag: "OBSERVED" }],
    ["overhead", "MOVEMENT", "Overhead reach", "Back to the wall, arms up with thumbs to the wall. Watch the ribs and lower back.", "", "CHOICE", "HIGHER_BETTER", "OBSERVED", "BOTH", ["Full", "Limited left", "Limited right", "Limited both"]],
    ["squat", "MOVEMENT", "Deep squat quality", "Bodyweight, feet hip width, arms forward. Three reps. Film front and side.", "/3", "SCORE_0_3", "HIGHER_BETTER", "OBSERVED", "BOTH", [], { criteria: ["3 · Heels down, hips below knees, trunk upright, knees track the toes", "2 · One change: heels lift, or knees drift in, or trunk tips", "1 · Two or more changes", "0 · Pain stops the movement"] }],
    ["balance", "MOVEMENT", "Single leg balance", "Eyes open, hands on hips. Stop when the foot touches down or moves. Best of three.", "s", "STOPWATCH", "HIGHER_BETTER", "MEASURED", "BOTH", [], { sided: true, flagDiff: 8 }],
    ["foot", "MOVEMENT", "Foot and arch posture", "Standing relaxed, then on one leg. Watch the arch and the knee.", "", "CHOICE", "HIGHER_BETTER", "OBSERVED", "BOTH", ["Neutral", "Arch drops right", "Arch drops both", "High arch"]],
    ["knee", "MOVEMENT", "Knee pain on deep squat", "Ask at the bottom of the squat. Their own number, 0 to 10.", "/10", "SCALE_0_10", "LOWER_BETTER", "SELF_REPORTED", "BOTH"],
    ["posture", "MOVEMENT", "Posture photos", "Front, side and back. Grid and plumb line overlay.", "", "PHOTO", "NONE", "OBSERVED", "BOTH"],
    ["hold", "BREATH", "Breath hold after exhale", "Seated. Normal breath in and out, hold the nose, time to the first clear urge.", "s", "STOPWATCH", "HIGHER_BETTER", "MEASURED", "BOTH"],
    ["rate", "BREATH", "Resting breaths per minute", "Seated, eyes closed. Count for 2 minutes, divide by 2.", "/min", "NUMBER", "LOWER_BETTER", "MEASURED", "BOTH"],
    ["exhale", "BREATH", "Exhale length", "One slow exhale through the nose after a full breath in.", "s", "STOPWATCH", "HIGHER_BETTER", "MEASURED", "BOTH"],
    ["ribsUpper", "BREATH", "Rib expansion, upper", "Tape under the armpits. Full exhale, full inhale, read the difference.", "cm", "NUMBER", "HIGHER_BETTER", "MEASURED", "IN_PERSON"],
    ["ribs", "BREATH", "Rib expansion, lower", "Tape at the base of the sternum. Full exhale, full inhale, read the difference.", "cm", "NUMBER", "HIGHER_BETTER", "MEASURED", "IN_PERSON"],
    ["ribsBack", "BREATH", "Rib expansion, back", "Hands on the lower back ribs, tape across. Full exhale, full inhale.", "cm", "NUMBER", "HIGHER_BETTER", "MEASURED", "IN_PERSON"],
    ["nasal", "BREATH", "Nasal breathing under effort", "Two floors of stairs at a steady pace, mouth closed.", "", "CHOICE", "HIGHER_BETTER", "OBSERVED", "BOTH", ["Yes", "Partly", "Not yet"]],
    ["pattern", "BREATH", "Breathing pattern", "Hands on chest and belly, seated then lying.", "", "CHOICE", "HIGHER_BETTER", "OBSERVED", "BOTH", ["Chest led", "Belly led", "360 expansion"]],
    ["sleep", "RECOVERY", "Average sleep", "From intake, confirm with the client.", "h", "NUMBER", "HIGHER_BETTER", "SELF_REPORTED", "BOTH"],
    ["bedtime", "RECOVERY", "Bedtime range", "From intake: earliest and latest usual bedtime.", "", "CHOICE", "NONE", "SELF_REPORTED", "BOTH"],
    ["selfrec", "RECOVERY", "Recovery after training", "Their rating the morning after hard exercise.", "/10", "SCALE_0_10", "HIGHER_BETTER", "SELF_REPORTED", "BOTH"],
    ["stress", "RECOVERY", "Stress and workload", "Their rating for a typical work week.", "/10", "SCALE_0_10", "LOWER_BETTER", "SELF_REPORTED", "BOTH"],
    ["rhr", "RECOVERY", "Resting heart rate", "Seated 5 minutes, then read for 1 minute.", "bpm", "NUMBER", "LOWER_BETTER", "MEASURED", "BOTH"],
    ["goblet", "PERFORMANCE", "Goblet squat, 8 reps", "To a 40 cm box. Stop before form changes or pain goes over 3.", "kg", "NUMBER", "HIGHER_BETTER", "MEASURED", "IN_PERSON"],
    ["pushup", "PERFORMANCE", "Push ups until form breaks", "Full range, hips in line. Count clean reps.", "reps", "NUMBER", "HIGHER_BETTER", "MEASURED", "BOTH"],
    ["plank", "PERFORMANCE", "Plank hold", "Forearms. Stop when the lower back sags.", "s", "STOPWATCH", "HIGHER_BETTER", "MEASURED", "BOTH"],
    ["vjump", "PERFORMANCE", "Vertical jump", "Countermovement, best of three.", "cm", "NUMBER", "HIGHER_BETTER", "MEASURED", "IN_PERSON"],
    ["run1k", "PERFORMANCE", "1 km run time", "Flat route or treadmill at 1 percent. Steady best effort.", "min:sec", "TIME", "LOWER_BETTER", "MEASURED", "BOTH"],
    ["sts", "PERFORMANCE", "Single leg sit to stand", "From a 45 cm box, no hands. Count clean reps each side.", "reps", "LR_PAIR", "HIGHER_BETTER", "MEASURED", "BOTH", [], { sided: true }],
  ];
  for (const [i, [key, system, name, howTo, unit, inputType, direction, tag, availability, choices, extra]] of bank.entries()) {
    await db.testDefinition.create({ data: { key, system, name, howTo, unit, inputType, direction, tag, availability, choices: choices ?? [], order: i, ...(extra ?? {}) } });
  }

  // ── Module library (templates). Coverage = client facing contribution per system. ──
  const cov = (m?: [number, string, string], b?: [number, string, string], r?: [number, string, string], p?: [number, string, string]) =>
    ([["MOVEMENT", m], ["BREATH", b], ["RECOVERY", r], ["PERFORMANCE", p]] as const).filter(([, v]) => v).map(([system, v]) => ({ system, level: v![0], tag: v![1], why: v![2] }));
  const tpl = (family: string, version: number, status: "DRAFT" | "PUBLISHED" | "ARCHIVED", data: Omit<Prisma.ModuleTemplateCreateInput, "family" | "version" | "status">) =>
    db.moduleTemplate.create({ data: { family, version, status, publishedAt: status === "PUBLISHED" ? d("2026-08-01") : null, ...data } });

  await tpl("intake", 6, "PUBLISHED", { name: "Intake", type: "FORM", isDefault: true, shortLine: "Goals, history, safety check", purpose: "Your goals, training history and a short safety check.", inUse: 142, coverage: cov(undefined, undefined, [1, "Self reported", "Your intake answers on sleep and stress"]) });
  await tpl("capture", 4, "PUBLISHED", { name: "Online Capture", type: "CAPTURE", isDefault: true, shortLine: "Photos, videos and self tests at home", purpose: "Guided photos, movement videos and self tests at home. A practitioner reviews them.", inUse: 138, coverage: cov([1, "Observed", "Posture photos and movement videos"], [1, "Self reported", "Self timed breath hold and breathing video"], [1, "Self reported", "Your answers plus any connected health app"], [1, "Self reported", "Bodyweight self tests at home"]) });
  await tpl("inperson", 3, "PUBLISHED", { name: "In person session", type: "IN_PERSON", availability: "IN_PERSON", shortLine: "Hands on measures and a trial training", purpose: "Movement Assessment, Breath Session and Trial Training with a practitioner at the centre.", defaultPaid: true, inUse: 41, coverage: cov([2, "Measured", "Joint ranges measured by hand, left and right"], [2, "Measured", "Rib expansion measured with a tape"], [2, "Measured", "Resting heart rate measured"], [2, "Measured", "Loaded and timed tests with a coach"]) });
  await tpl("gait", 2, "PUBLISHED", {
    name: "Running gait video", type: "CAPTURE", shortLine: "A short side view of you running", purpose: "A 20 second side view of you running, so we can see how your knee takes load.", instructions: "Phone on its side, 3 metres away, hip height. Run past twice.", safetyNote: "Run only if it feels fine today. Stop if your knee goes above 3 out of 10.", inUse: 9,
    fields: [
      { key: "video", label: "Side view, running", type: "VIDEO", meta: "Video · up to 20 s", maxSeconds: 20, map: { system: "MOVEMENT", measure: "Running stride", tag: "OBSERVED", availability: "ONLINE" } },
      { key: "where", label: "Where did you record?", type: "SINGLE_CHOICE", meta: "Choice", options: ["Treadmill", "Road or track", "Indoors"] },
      { key: "pain", label: "Knee pain while running", type: "SCALE", meta: "Scale 0 to 10", map: { system: "MOVEMENT", measure: "Knee pain running", unit: "/10", tag: "SELF_REPORTED", direction: "LOWER_BETTER", availability: "BOTH" } },
      { key: "note", label: "Anything Jayraj should know?", type: "SHORT_TEXT", meta: "Optional", placeholder: "For example: knee felt fine, shoes were new" },
    ],
    rules: [{ text: "Add automatically when intake goal includes running" }, { text: "Add automatically when intake flags knee pain above 4" }],
    coverage: cov([1, "Observed", "Running video adds stride and knee load"]),
  });
  await tpl("desk", 1, "DRAFT", {
    name: "Desk and workday setup", type: "CAPTURE", shortLine: "Your desk and workday", purpose: "Two photos of your desk and a few questions about your workday.", instructions: "Sit as you normally work. Ask someone to take the side photo.", inUse: 0,
    fields: [
      { key: "photo", label: "Desk side view", type: "PHOTO", meta: "Photo · custom overlay", map: { system: "MOVEMENT", measure: "Desk posture", tag: "OBSERVED", availability: "ONLINE" } },
      { key: "hours", label: "Hours seated per day", type: "NUMBER_UNIT", unit: "h", meta: "Number · h", map: { system: "RECOVERY", measure: "Seated hours", unit: "h", tag: "SELF_REPORTED", direction: "LOWER_BETTER", availability: "BOTH" } },
      { key: "neck", label: "Neck stiffness at day end", type: "SCALE", meta: "Scale 0 to 10", map: { system: "MOVEMENT", measure: "Neck stiffness", unit: "/10", tag: "SELF_REPORTED", direction: "LOWER_BETTER", availability: "BOTH" } },
    ],
    rules: [{ text: "Add automatically when stress and workload is 7 or more" }],
    coverage: cov([1, "Observed", "Desk photos show how you sit"]),
  });
  await tpl("sport", 1, "PUBLISHED", { name: "Sport specific tests", type: "SELF_TESTS", shortLine: "Short tests for your sport", purpose: "Three short tests for change of direction and landing.", inUse: 4, fields: [{ key: "t1", label: "5 10 5 shuttle", type: "TIMER", meta: "Timer" }, { key: "t2", label: "Single leg hops, each side", type: "COUNTER", meta: "Counter" }], coverage: cov(undefined, undefined, undefined, [1, "Self reported", "Sport specific self tests"]) });
  await tpl("injury", 2, "PUBLISHED", { name: "Injury history in depth", type: "FORM", shortLine: "More about past injuries", purpose: "A few more questions about past injuries so your practitioner can plan around them.", inUse: 17, fields: [{ key: "what", label: "What happened?", type: "LONG_TEXT", meta: "Text" }, { key: "when", label: "When?", type: "SHORT_TEXT", meta: "Month and year", placeholder: "Mar 2023" }] });
  await tpl("blood", 1, "PUBLISHED", { name: "Blood report upload request", type: "UPLOAD", shortLine: "Your latest blood report", purpose: "Your latest blood report, so your practitioner has it before writing your report.", inUse: 12, fields: [{ key: "file", label: "Blood report", type: "UPLOAD", meta: "PDF or photo" }, { key: "date", label: "Test date", type: "SHORT_TEXT", meta: "Month and year", placeholder: "Aug 2026" }] });
  await tpl("mri", 1, "PUBLISHED", { name: "Upload your last MRI", type: "UPLOAD", shortLine: "Your knee MRI report", purpose: "Your knee MRI report, so it is read before your report is written.", inUse: 3, fields: [{ key: "file", label: "MRI report", type: "UPLOAD", meta: "PDF or photo" }, { key: "date", label: "Test date", type: "SHORT_TEXT", meta: "Month and year", placeholder: "Mar 2025" }, { key: "side", label: "Which side?", type: "SINGLE_CHOICE", meta: "Choice", options: ["Left", "Right", "Both"] }] });
  await tpl("live", 2, "PUBLISHED", { name: "Live video session", type: "LIVE_VIDEO", shortLine: "A live call with a practitioner", purpose: "A 30 minute live call to watch your movement with a practitioner.", inUse: 23, coverage: cov([1, "Observed", "Movement watched live on video"]) });
  await tpl("breath", 1, "PUBLISHED", { name: "Breath session", type: "IN_PERSON", availability: "IN_PERSON", defaultPaid: true, shortLine: "Breath work at the centre", purpose: "A breath session at the centre with a breath coach.", inUse: 8, coverage: cov(undefined, [2, "Measured", "Breath measures taken in person"]) });
  await tpl("photos", 1, "PUBLISHED", { name: "Follow up photos", type: "CAPTURE", shortLine: "Retake your posture photos", purpose: "Retake your posture photos so we can see what changed.", inUse: 6, coverage: cov([1, "Observed", "Follow up posture photos"]) });
  await tpl("posture", 1, "ARCHIVED", { name: "Old posture form", type: "FORM", shortLine: "Archived", purpose: "Replaced by Online Capture.", inUse: 0 });

  // ── Products (mirrored from Shopify; prices are placeholders) ──
  const product = (slug: string, name: string, kind: Prisma.ProductCreateInput["kind"], priceLabel: string, sessions?: number, validityDays?: number) =>
    db.product.create({ data: { slug, name, kind, priceLabel, sessions, validityDays, shopifyProductId: "gid://shopify/Product/" + slug } });
  await product("online-assessment", "Online Assessment", "ASSESSMENT", "₹X,XXX");
  await product("in-person-session", "In person session", "IN_PERSON_SESSION", "₹X,XXX");
  await product("pt-12", "Personal Training", "PERSONAL_TRAINING", "₹XX,XXX", 12, 45);
  await product("group-24", "Group Training", "GROUP_TRAINING", "₹XX,XXX", 24, 60);

  // ── Notification templates (Settings → Notifications) ──
  const nt: [string, string, "WHATSAPP" | "EMAIL", string | null, string][] = [
    ["step_added", "Step added", "WHATSAPP", null, "Hi {first_name}, {staff_name} added a step to your assessment: {module_name}.\n\n“{note}”\n\nIt takes about XX min. Open it here: {link}"],
    ["step_added", "Step added", "EMAIL", "{staff_name} added a step to your assessment", "Hi {first_name},\n\n{staff_name} added {module_name} to your assessment plan. Due {due}.\n\nYour report is written once every required step is done.\n\nOpen your plan →"],
    ["in_person_recommended", "In person recommended", "WHATSAPP", null, "Hi {first_name}, thanks for sending your capture. Since you are near {centre}, we recommend an in person session next. It is paid and optional. See why: {link}"],
    ["session_reminder", "Session reminder", "WHATSAPP", null, "Hi {first_name}, your {session_type} is {when} at {centre}. Please arrive 10 minutes early and wear clothes you can move in. Reply here if you need to change anything."],
    ["session_rescheduled", "Session rescheduled", "WHATSAPP", null, "Hi {first_name}, your {session_type} has moved to {when} at {centre}. Reply here if that does not work for you."],
    ["session_confirmed", "Session confirmed", "WHATSAPP", null, "Hi {first_name}, your {session_type} on {when} is confirmed. {coach} has been notified."],
    ["report_ready", "Report ready", "WHATSAPP", null, "Hi {first_name}, your report is ready. Open it here: {link}"],
    ["report_ready", "Report ready", "EMAIL", "Your report is ready", "Hi {first_name},\n\nYour ADITUS report is ready. It has your starting point, what matters most and your recommended path.\n\nOpen your report →"],
    ["retake_requested", "Retake requested", "WHATSAPP", null, "Hi {first_name}, {staff_name} needs {what} again. {reason} It takes about 3 minutes: {link}"],
    ["nudge", "Nudge", "WHATSAPP", null, "Hi {first_name}, you are {progress} through your {module_name}. Everything so far is saved. Pick up where you left off: {link}"],
    ["nudge", "Nudge", "EMAIL", "Pick up where you left off", "Hi {first_name},\n\nYou are {progress} through your {module_name}. Everything so far is saved.\n\nContinue →"],
    ["intake_unfinished_24h", "Intake unfinished · 24 h", "WHATSAPP", null, "Hi {first_name}, your intake is saved where you left it. It takes about XX min to finish: {link}"],
    ["intake_unfinished_72h", "Intake unfinished · 72 h", "EMAIL", "Your intake is waiting", "Hi {first_name},\n\nYour intake is saved where you left it. Finish it and you can book your assessment.\n\nContinue →"],
  ];
  for (const [key, name, channel, subject, body] of nt) await db.notificationTemplate.create({ data: { key, name, channel, subject, body } });

  // ── Settings ──
  await db.setting.create({
    data: {
      key: "mumbai_area",
      value: {
        cities: ["Mumbai", "Thane", "Navi Mumbai", "Mira Bhayandar", "Vasai Virar"],
        pinPrefixes: ["400", "401", "4102", "4106", "4107", "4112"],
        radiusLabel: "Within XX km of TIC Kandivali or Samyah Borivali",
        source: "City and PIN from account setup, else Shopify address",
        whenInside: "Recommend In person session · paid · never forced",
        whenOutside: "No in person option · “Visiting Mumbai? Message the team.”",
        replaces: "Set per template: Adds to (default) or Replaces",
      },
    },
  });
  await db.setting.create({ data: { key: "retention", value: [["Health documents", "Kept for XX years after access ends"], ["Photos and videos", "Kept for XX years · deleted on request"], ["Testimonial", "Opt in · withdrawable"]] } });
  await db.setting.create({ data: { key: "contact", value: { whatsapp: "+91 98200 41700", email: "team@aditus.in" } } });

  // Shared bcrypt for sample client passwords (dev only).
  const pw = await bcrypt.hash("aditus-demo-1", 10);
  return { tic, samyah, jayraj, shimyu, sahil, arjun, pw };
}

export type Base = Awaited<ReturnType<typeof seedBase>>;
