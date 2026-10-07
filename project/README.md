# ADITUS Portal · file map

Design system: `_ds/aditus-design-system-884a4c…/`. Every screen loads its tokens and `_ds_bundle.js` in `<helmet>`.

Entry points: **06** for clients, **12** for staff.

## Client (phone first)
| File | Covers |
|---|---|
| 01 Client - Sign In | Login details email, account setup (details with city and PIN, password or email link, consents), returning sign in, expired link |
| 02 Client - Assessment Journey | Online Capture wizard (photos, videos, self tests, retake, upload failed, consent off), live video session, full report, Compare |
| 03 Client - Intake and Booking | Intake (10 sections, safety check, consent), documents, booking, reminders |
| 04 Client - Assessment Day | In person day: check in, phase tracker, close, report walkthrough |
| 05 Client - Dashboard | Full portal after training is bought: Home, Assessment, Calendar, My plan, Health data, Documents, Orders, Account, plan end and export |
| 06 Client - Assessment Plan | Modular plan, coverage, custom steps, in person recommendation (checkout, welcome, after capture, Home), Add and book, report next steps, messages |

## Staff (desktop, tablet for consoles)
| File | Covers |
|---|---|
| 10 Staff - Practitioner Console | Live and in person capture, priorities, submit for review |
| 11 Staff - Photo Review | Review of Online Capture, retake requests, head coach approval |
| 12 Staff - Admin Console | Separate staff interface: sign in, Today by role, Clients, client file with plan editor and Preview as client, Assessments, Schedule, Modules builder, Reports, Plans and billing, Team, Settings |

## Shared components
| File | Used by |
|---|---|
| 20 Shared - Coverage Matrix | 02 |
| 21 Shared - Coverage Grid | 06 · prop `rows` computed from the plan's modules |

## Flow
Client: 01 → 06 → 03 (intake) → 02 (capture) or 04 (in person) → 06 report → 05 once training is bought.
Staff: 12 → 11 or 10 → 12 Reports to release.

Sample data is fictional. Prices `₹XX,XXX` and durations `XX min` are placeholders.
