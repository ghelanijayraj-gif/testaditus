# ADITUS portal

The client portal and staff Admin Console from the Claude Design handoff (`../project`, `../chats`), built as one
Next.js app with two separate interfaces.

- **Client portal**: phone first. Sign in and account setup, intake, the modular assessment plan (Online Capture, custom
  steps, Mumbai in person recommendation with Add and book), assessment day (in person and live online), reports and
  Compare, then the full training dashboard (Calendar, My plan, Health data, Documents, Orders and invoices, Account) and
  plan end (export, grace period, access ended).
- **Staff Admin Console** (`/staff`, or its own host): invite only sign in with a second step. It includes Today by role,
  Clients, the client file with the plan editor and Preview as client, Assessments (practitioner console, photo review,
  head coach approval), Schedule, Modules builder, Reports, Plans and billing, Team and Settings.

## Stack

Next.js 15 (App Router, Server Components, Server Actions) · React 19 · TypeScript · Prisma 6 + PostgreSQL ·
Auth.js v5 · CSS Modules on the ADITUS design system tokens.

## Run it

```bash
cp .env.example .env            # adjust DATABASE_URL if needed
npm install
npx prisma migrate deploy       # create the schema (prisma/schema/migrations)
npx prisma db seed              # fictional sample data (wipes the database)
npm run dev                     # http://localhost:3000 (client) and http://localhost:3000/staff (staff)
```

Postgres 14+ is required; any local instance works (`postgresql://aditus:aditus@localhost:5432/aditus` by default).

`APP_NOW` in `.env` pins "now" to **Wed 7 Oct 2026, 7:52 PM IST**, the date the designs and sample data use. Remove it to
run on the real clock.

### Demo sign in (development only, `DEV_AUTH=1`)

- **Clients**: `/signin` lists every demo client grouped by journey stage (setup, intake, uploads, waiting for
  evaluation, in person, report, training, plan ended). Pick one, or use password `aditus-demo-1`. In the portal,
  **Switch demo client** (under Sign out) goes back to the list.
- **Staff**: `/staff/signin` lists Jayraj (Founder), Shimyu (Head of department), Sahil (Ops admin) and Arjun (Finance).
  The second step screen shows the current TOTP code in development. In the console, the top bar's role switch signs you in as
  that role (Practitioner = Jayraj viewing his own clients).
- Scripts: `node scripts/crawl.mjs` (signs in as every demo account and loads the main routes), `GET /api/dev/login?kind=client|staff&email=…&to=/path`, `node scripts/shot.mjs` (screenshots).

### Demo clients (one per lifecycle state)

| Login | State |
|---|---|
| zara@example.com | Paid on Shopify, account not set up (`/setup/zara-setup-demo`) |
| neel@example.com | Welcome, plan not started, in person recommended |
| kavya@example.com | Intake half done |
| aarav@example.com | Primary sample: capture submitted, in person booked, gait video added by Jayraj |
| ishaan@example.com | Online only, MRI step, capture "more needed" |
| diya@example.com | Online Capture 70 percent |
| rhea@example.com | Capture submitted, recommendation shown |
| tara@example.com | In person added, waiting for payment |
| vikram@example.com | Recommendation dismissed, online only |
| dhruv@example.com | In person session today, "I am here" |
| meera@example.com | In person assessment in progress (phase tracker) |
| nikhil@example.com | Capture submitted, waiting for coach evaluation |
| kabir@example.com | Report waiting for head coach approval |
| sana@example.com | Report released today: walkthrough, choose your path |
| ananya@example.com | Training: session tomorrow unconfirmed (warning), full dashboard |
| rohan@example.com | Training, plan expiring |
| ishita@example.com | Reassessment done, Compare unlocked |
| farah@example.com | Plan ended, export ready, grace period |
| omar@example.com | Access ended |

## Architecture

```
src/
  app/
    (client)/            client portal: signin, setup, welcome, checkout (simulated Shopify)
      (portal)/          pages inside the portal shell (Home, Assessment, Calendar, My plan, …)
      (focus)/           focused flows without the shell (intake, assessment day, live session, report walkthrough)
    staff/
      signin/            staff sign in + TOTP second step
      (console)/         Admin Console pages (rail + dark top bar)
      (consoles)/        practitioner console, head coach review, photo review (tablet first)
    api/                 auth (two instances), files (permission checked + access logged), calendar .ics, dev helpers
  components/ds          ADITUS design system primitives (ported from the bundle)
  components/shared      BodyMap (front/back/side muscle groups), CoverageGrid
  lib/                   clock, formatting, permissions, assessment plan logic, measures
  server/
    auth/                client and staff Auth.js instances, guards (requireClient, requireStaff, scoping, audit, access log)
    integrations/        notifier (outbox), Shopify (simulated checkout), storage (local disk)
prisma/
  schema/                core.prisma + one file per feature area
  seed/                  base data, sample clients, one module per area
```

### Separation and privacy

- Two Auth.js instances with different secrets, cookie names and base paths (`/api/auth/client`, `/api/auth/staff`).
  Each only admits its own account kind, so a staff session can never use the client portal and the reverse.
- Set `STAFF_HOST` (e.g. `staff.aditus.in`) to serve the console from its own address; the client host then refuses
  `/staff`.
- Staff sign in: Google Workspace (when `AUTH_GOOGLE_ID` is set, restricted with `STAFF_GOOGLE_WORKSPACE_DOMAIN`) or an
  email link, then TOTP. The TOTP check is recorded server side and only then marked on the session.
- Roles and permissions follow Settings → Roles and permissions (`src/lib/permissions.ts`). Practitioners see their own
  clients, heads of department their segment, the founder everything. Ops admin and Finance never see health
  documents, media or measures.
- Every staff view of health documents, media or measures, and every denied attempt, goes to the audit log and to the
  client's access log. Preview as client is view only, watermarked and logged.
- Staff plan edits stay as drafts, invisible to the client, until **Send to client**.

### Integrations (stubbed behind interfaces)

| Interface | Dev implementation | Production |
|---|---|---|
| `notifier` (`server/integrations/notify.ts`) | writes WhatsApp, email and portal messages to `OutboxMessage` (also the client's "Sent to you" log) | WhatsApp Business API + email provider |
| `shopify` (`server/integrations/shopify.ts`) | `Checkout` row and a local `/checkout/[id]` page that simulates payment and runs the purchase handler | Shopify checkout + `orders/paid` webhook |
| `storage` (`server/integrations/storage.ts`) | local `.uploads/` | S3 or GCS with signed URLs |
| Health apps | connect flow records consent and seeds sample data | Apple Health, Health Connect, Garmin, Whoop, Oura |
| Live video | camera self view + join link | a video provider (pluggable) |

### Coach evaluation and the report

Phase one is assessment only: clients upload photos and videos (Online Capture), a coach evaluates them, the head coach
approves, and the client gets the report. There are no live video sessions.

- **Evaluate** (`/staff/evaluate/[clientId]`, from Assessments, Today and the client file): uploads on the left, the
  evaluation on the right, section by section. Every parameter can take a note, attach the photo or video on screen as
  evidence, and be marked as a priority. Autosaves. **Summary and submit** writes the top of the report and sends it to
  the head coach.
- **Head coach review** (`/staff/review/[reportId]`): the report as the client will see it, plus internal items, with
  Approve and release, Return with comment, or Edit evaluation.
- **Client report** (`/reports/[id]`): scores, summary, priorities, each section, recommended next step, Save as PDF.

All parameters, options and report wording live in **`src/config/evaluation.ts`**. The current ones are placeholders that
show every input type (scale, grade, choice, multi select, number with left and right, yes or no, body areas, text).
Replace them there; the screens follow. Keep a parameter's `key` stable once real evaluations exist.

The console also hides training sections for now (Modules, Plans and billing, Team, Settings, and the Program, Health
data and Billing tabs). Set `FULL_CONSOLE=1` to show them.

### Copy and design rules

Copy follows the handoff: direct, no diagnosis language, no hype, no hyphens or dashes in UI copy, no emoji, and
prices stay as `₹XX,XXX` placeholders. Visuals use only the design system tokens: square corners, ink rules, one
accent blue, and no red or green.
