-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AccountKind" AS ENUM ('CLIENT', 'STAFF');

-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('FOUNDER', 'HOD', 'PRACTITIONER', 'OPS', 'FINANCE');

-- CreateEnum
CREATE TYPE "SignInMethod" AS ENUM ('EMAIL_LINK', 'PASSWORD');

-- CreateEnum
CREATE TYPE "LifecycleStage" AS ENUM ('ASSESSMENT_PURCHASED', 'ONBOARDING', 'ASSESSMENT_DAY', 'REPORT', 'TRAINING', 'PLAN_ENDED', 'GRACE', 'ACCESS_ENDED');

-- CreateEnum
CREATE TYPE "AssessmentStatus" AS ENUM ('PURCHASED', 'PROFILE_REQUIRED', 'INTAKE_REQUIRED', 'INTAKE_COMPLETE', 'BOOKING_REQUIRED', 'SESSION_BOOKED', 'IN_PROGRESS', 'PRACTITIONER_REVIEW', 'REPORT_PROCESSING', 'REPORT_READY');

-- CreateEnum
CREATE TYPE "RecommendationState" AS ENUM ('NOT_ELIGIBLE', 'NOT_SHOWN', 'SHOWN', 'DISMISSED', 'WAITING_FOR_PAYMENT', 'ADDED', 'BOOKED');

-- CreateEnum
CREATE TYPE "CoachRole" AS ENUM ('ASSESSMENT', 'PERSONAL_TRAINING', 'GROUP_TRAINING', 'BREATH');

-- CreateEnum
CREATE TYPE "ConsentKind" AS ENUM ('HEALTH_DOCUMENTS', 'PHOTOS_VIDEOS', 'HEALTH_APP_SYNC', 'TESTIMONIAL', 'COMMUNITY', 'ASSESSMENT_AGREEMENT', 'ASSESSMENT_MEDIA');

-- CreateEnum
CREATE TYPE "ModuleType" AS ENUM ('FORM', 'CAPTURE', 'SELF_TESTS', 'UPLOAD', 'LIVE_VIDEO', 'IN_PERSON', 'REVIEW_CALL', 'CONNECT_HEALTH', 'SYSTEM');

-- CreateEnum
CREATE TYPE "ModuleStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'MORE_NEEDED', 'WAITING_FOR_PAYMENT', 'BOOKED', 'DONE', 'SKIPPED_BY_PRACTITIONER');

-- CreateEnum
CREATE TYPE "TemplateStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AddedBy" AS ENUM ('SYSTEM', 'PRACTITIONER', 'ADMIN', 'RECOMMENDED');

-- CreateEnum
CREATE TYPE "Availability" AS ENUM ('ONLINE', 'IN_PERSON', 'BOTH');

-- CreateEnum
CREATE TYPE "PlanKind" AS ENUM ('BASELINE', 'REASSESSMENT');

-- CreateEnum
CREATE TYPE "SystemKey" AS ENUM ('MOVEMENT', 'BREATH', 'RECOVERY', 'PERFORMANCE');

-- CreateEnum
CREATE TYPE "MeasureTag" AS ENUM ('MEASURED', 'OBSERVED', 'SELF_REPORTED');

-- CreateEnum
CREATE TYPE "Direction" AS ENUM ('HIGHER_BETTER', 'LOWER_BETTER', 'NONE');

-- CreateEnum
CREATE TYPE "Side" AS ENUM ('LEFT', 'RIGHT', 'BOTH', 'NONE');

-- CreateEnum
CREATE TYPE "InputType" AS ENUM ('NUMBER', 'LR_PAIR', 'STOPWATCH', 'SCORE_0_3', 'SCALE_0_10', 'CHOICE', 'TIME', 'PHOTO');

-- CreateEnum
CREATE TYPE "AssessmentFormat" AS ENUM ('ONLINE', 'IN_PERSON', 'LIVE_ONLINE');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'RETURNED', 'RELEASED');

-- CreateEnum
CREATE TYPE "RecommendedPath" AS ENUM ('PERSONAL_TRAINING', 'GROUP_TRAINING', 'EITHER');

-- CreateEnum
CREATE TYPE "MediaKind" AS ENUM ('PHOTO', 'VIDEO');

-- CreateEnum
CREATE TYPE "MediaStatus" AS ENUM ('UPLOADED', 'NEEDS_REVIEW', 'ACCEPTED', 'RETAKE_REQUESTED', 'FAILED');

-- CreateEnum
CREATE TYPE "DocumentSource" AS ENUM ('CLIENT', 'ADITUS');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('BLOOD_TEST', 'XRAY', 'MRI', 'PHYSIO_NOTE', 'DOCTOR_NOTE', 'ASSESSMENT_REPORT', 'REASSESSMENT_REPORT', 'PROGRESS_PHOTO', 'PROGRESS_VIDEO', 'INVOICE', 'CONSENT', 'OTHER');

-- CreateEnum
CREATE TYPE "AccessAction" AS ENUM ('VIEWED', 'DENIED', 'PREVIEW_AS_CLIENT');

-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('PERSONAL_TRAINING', 'GROUP_TRAINING', 'ASSESSMENT', 'MOVEMENT_ASSESSMENT', 'IN_PERSON_ASSESSMENT', 'BREATH_SESSION', 'TRIAL_TRAINING', 'LIVE_VIDEO', 'REVIEW_CALL', 'REASSESSMENT', 'COMMUNITY_EVENT');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('SCHEDULED', 'CONFIRMED', 'DONE', 'CANCELLED', 'MISSED', 'RESCHEDULED');

-- CreateEnum
CREATE TYPE "ProductKind" AS ENUM ('ASSESSMENT', 'IN_PERSON_SESSION', 'PERSONAL_TRAINING', 'GROUP_TRAINING', 'ADD_ON', 'SHOP');

-- CreateEnum
CREATE TYPE "ClientPlanStatus" AS ENUM ('ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('SYNCED', 'PENDING', 'FAILED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('PAID', 'DUE', 'OVERDUE');

-- CreateEnum
CREATE TYPE "HealthProvider" AS ENUM ('APPLE_HEALTH', 'GOOGLE_HEALTH_CONNECT', 'GARMIN', 'WHOOP', 'OURA', 'SMART_SCALE');

-- CreateEnum
CREATE TYPE "HealthSourceStatus" AS ENUM ('CONNECTED', 'NOT_CONNECTED', 'ERROR');

-- CreateEnum
CREATE TYPE "Channel" AS ENUM ('WHATSAPP', 'EMAIL', 'PORTAL');

-- CreateEnum
CREATE TYPE "OutboxStatus" AS ENUM ('QUEUED', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "ConsoleFindingDraft" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "testKey" TEXT NOT NULL,
    "picked" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "observed" TEXT NOT NULL DEFAULT '',
    "whyItMatters" TEXT NOT NULL DEFAULT '',
    "workOn" TEXT NOT NULL DEFAULT '',
    "related" TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsoleFindingDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaptureReview" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "moduleKey" TEXT NOT NULL,
    "reviewerName" TEXT,
    "finishedAt" TIMESTAMP(3),
    "pausedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaptureReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "name" TEXT,
    "image" TEXT,
    "kind" "AccountKind" NOT NULL,
    "passwordHash" TEXT,
    "signInMethod" "SignInMethod" NOT NULL DEFAULT 'EMAIL_LINK',
    "tempPasswordHash" TEXT,
    "tempPasswordExpires" TIMESTAMP(3),
    "totpSecret" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Centre" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "city" TEXT NOT NULL DEFAULT 'Mumbai',
    "address" TEXT NOT NULL,
    "directionsUrl" TEXT NOT NULL,
    "entryNote" TEXT,
    "hoursLabel" TEXT,
    "rooms" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Centre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "StaffRole" NOT NULL,
    "segment" TEXT,
    "title" TEXT NOT NULL,
    "availability" TEXT,
    "yearsCoaching" TEXT,
    "credentials" TEXT,
    "specialities" TEXT,
    "shownToClients" BOOLEAN NOT NULL DEFAULT false,
    "photoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffCentre" (
    "staffId" TEXT NOT NULL,
    "centreId" TEXT NOT NULL,

    CONSTRAINT "StaffCentre_pkey" PRIMARY KEY ("staffId","centreId")
);

-- CreateTable
CREATE TABLE "ClientProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "mobile" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "emergencyName" TEXT,
    "emergencyPhone" TEXT,
    "city" TEXT,
    "pin" TEXT,
    "inMumbaiArea" BOOLEAN NOT NULL DEFAULT false,
    "preferredCentreId" TEXT,
    "whatsappUpdates" BOOLEAN NOT NULL DEFAULT true,
    "notifyEmailReport" BOOLEAN NOT NULL DEFAULT true,
    "notifyReassessWindow" BOOLEAN NOT NULL DEFAULT true,
    "accountSetupDone" BOOLEAN NOT NULL DEFAULT false,
    "setupStep" INTEGER NOT NULL DEFAULT 1,
    "intakeStep" INTEGER NOT NULL DEFAULT 0,
    "intakeCompletedAt" TIMESTAMP(3),
    "recommendationNote" TEXT,
    "recommendationAt" TIMESTAMP(3),
    "stage" "LifecycleStage" NOT NULL DEFAULT 'ASSESSMENT_PURCHASED',
    "assessmentStatus" "AssessmentStatus" NOT NULL DEFAULT 'PURCHASED',
    "recommendation" "RecommendationState" NOT NULL DEFAULT 'NOT_SHOWN',
    "strongRecommendation" BOOLEAN NOT NULL DEFAULT false,
    "primaryPractitionerId" TEXT,
    "goalHeadline" TEXT,
    "photoUrl" TEXT,
    "graceEndsAt" TIMESTAMP(3),
    "accessEndsAt" TIMESTAMP(3),
    "exportedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientCoach" (
    "clientId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "role" "CoachRole" NOT NULL,

    CONSTRAINT "ClientCoach_pkey" PRIMARY KEY ("clientId","staffId","role")
);

-- CreateTable
CREATE TABLE "Consent" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "kind" "ConsentKind" NOT NULL,
    "granted" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT NOT NULL DEFAULT 'setup',
    "version" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Consent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntakeSection" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "answers" JSONB NOT NULL DEFAULT '{}',
    "skipped" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntakeSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyFlag" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "note" TEXT,
    "label" TEXT NOT NULL DEFAULT 'Discuss before testing',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SafetyFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Injury" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "occurredOn" TEXT,
    "side" "Side" NOT NULL DEFAULT 'NONE',
    "treatments" TEXT[],
    "treatmentNote" TEXT,
    "documentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Injury_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BodyConcern" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "side" "Side" NOT NULL DEFAULT 'NONE',
    "intensity" INTEGER NOT NULL,
    "when" TEXT[],

    CONSTRAINT "BodyConcern_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModuleTemplate" (
    "id" TEXT NOT NULL,
    "family" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "TemplateStatus" NOT NULL DEFAULT 'DRAFT',
    "name" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "shortLine" TEXT,
    "type" "ModuleType" NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "timeEstimate" TEXT NOT NULL DEFAULT 'XX min',
    "instructions" TEXT,
    "safetyNote" TEXT,
    "availability" "Availability" NOT NULL DEFAULT 'ONLINE',
    "replacesCapture" BOOLEAN NOT NULL DEFAULT false,
    "defaultPaid" BOOLEAN NOT NULL DEFAULT false,
    "pricePaise" INTEGER,
    "priceLabel" TEXT,
    "fields" JSONB NOT NULL DEFAULT '[]',
    "rules" JSONB NOT NULL DEFAULT '[]',
    "coverage" JSONB NOT NULL DEFAULT '[]',
    "inUse" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "ModuleTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentPlan" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "kind" "PlanKind" NOT NULL DEFAULT 'BASELINE',
    "sentVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanModule" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "templateId" TEXT,
    "key" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "purpose" TEXT,
    "shortLine" TEXT,
    "type" "ModuleType" NOT NULL,
    "status" "ModuleStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "extraLine" TEXT,
    "progressDone" INTEGER,
    "progressTotal" INTEGER,
    "submittedAt" TIMESTAMP(3),
    "templateVersion" INTEGER,
    "coverage" JSONB NOT NULL DEFAULT '[]',
    "addedBy" "AddedBy" NOT NULL DEFAULT 'SYSTEM',
    "addedByName" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "pricePaise" INTEGER,
    "priceLabel" TEXT,
    "dueAt" TIMESTAMP(3),
    "dueLabel" TEXT,
    "note" TEXT,
    "timeEstimate" TEXT,
    "replacesCapture" BOOLEAN NOT NULL DEFAULT false,
    "strong" BOOLEAN NOT NULL DEFAULT false,
    "system" BOOLEAN NOT NULL DEFAULT false,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "draft" BOOLEAN NOT NULL DEFAULT false,
    "changed" BOOLEAN NOT NULL DEFAULT false,
    "removed" BOOLEAN NOT NULL DEFAULT false,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "data" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanVersion" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "summary" TEXT NOT NULL,
    "byName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestDefinition" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "system" "SystemKey" NOT NULL,
    "name" TEXT NOT NULL,
    "howTo" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "inputType" "InputType" NOT NULL,
    "direction" "Direction" NOT NULL,
    "tag" "MeasureTag" NOT NULL,
    "availability" "Availability" NOT NULL,
    "onlineTag" "MeasureTag",
    "choices" TEXT[],
    "criteria" TEXT[],
    "bodyView" TEXT,
    "bodyGroups" TEXT[],
    "focusKey" TEXT,
    "scaleMax" DOUBLE PRECISION,
    "focusSide" "Side",
    "min" DOUBLE PRECISION,
    "max" DOUBLE PRECISION,
    "step" DOUBLE PRECISION,
    "sided" BOOLEAN NOT NULL DEFAULT false,
    "flagDiff" DOUBLE PRECISION,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TestDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "kind" "PlanKind" NOT NULL DEFAULT 'BASELINE',
    "format" "AssessmentFormat" NOT NULL DEFAULT 'ONLINE',
    "date" TIMESTAMP(3) NOT NULL,
    "practitionerId" TEXT,
    "centreId" TEXT,
    "phase" TEXT,
    "measuresTotal" INTEGER NOT NULL DEFAULT 24,
    "cycle" INTEGER NOT NULL DEFAULT 1,
    "releasedAt" TIMESTAMP(3),
    "overallNote" TEXT,
    "paused" BOOLEAN NOT NULL DEFAULT false,
    "phases" JSONB NOT NULL DEFAULT '[]',
    "includesCold" BOOLEAN NOT NULL DEFAULT false,
    "testKeys" TEXT[],
    "online" BOOLEAN NOT NULL DEFAULT false,
    "connectionLost" BOOLEAN NOT NULL DEFAULT false,
    "clientMessage" TEXT,
    "submittedAt" TIMESTAMP(3),

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeasureValue" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "assessmentId" TEXT,
    "testKey" TEXT NOT NULL,
    "side" "Side" NOT NULL DEFAULT 'NONE',
    "value" DOUBLE PRECISION,
    "text" TEXT,
    "unit" TEXT NOT NULL,
    "tag" "MeasureTag" NOT NULL,
    "notTested" BOOLEAN NOT NULL DEFAULT false,
    "method" TEXT,
    "comparable" BOOLEAN NOT NULL DEFAULT true,
    "skipReason" TEXT,
    "priority" BOOLEAN NOT NULL DEFAULT false,
    "observation" TEXT[],
    "note" TEXT,
    "source" TEXT NOT NULL DEFAULT 'console',
    "clientOpId" TEXT,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "capturedBy" TEXT,

    CONSTRAINT "MeasureValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "assessmentId" TEXT,
    "kind" "PlanKind" NOT NULL DEFAULT 'BASELINE',
    "status" "ReportStatus" NOT NULL DEFAULT 'DRAFT',
    "authorId" TEXT,
    "approverId" TEXT,
    "sections" JSONB NOT NULL DEFAULT '{}',
    "startingPoint" TEXT,
    "practitionerNote" TEXT,
    "recommendedPath" "RecommendedPath",
    "pathReason" TEXT,
    "nextSteps" JSONB NOT NULL DEFAULT '[]',
    "dueAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Finding" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "system" "SystemKey" NOT NULL,
    "title" TEXT NOT NULL,
    "observed" TEXT NOT NULL,
    "whyItMatters" TEXT NOT NULL,
    "workOn" TEXT NOT NULL,
    "related" TEXT[],
    "bodyGroups" TEXT[],
    "marker" JSONB,
    "measureKeys" TEXT[],

    CONSTRAINT "Finding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewComment" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "action" TEXT NOT NULL DEFAULT 'COMMENT',
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RetakeRequest" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "mediaId" TEXT,
    "step" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RetakeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "moduleKey" TEXT,
    "kind" "MediaKind" NOT NULL,
    "view" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "storageKey" TEXT,
    "durationS" INTEGER,
    "tag" "MeasureTag" NOT NULL DEFAULT 'OBSERVED',
    "status" "MediaStatus" NOT NULL DEFAULT 'UPLOADED',
    "retakeReason" TEXT,
    "supersededById" TEXT,
    "capturedBy" TEXT NOT NULL DEFAULT 'CLIENT',
    "annotations" JSONB NOT NULL DEFAULT '[]',
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "source" "DocumentSource" NOT NULL,
    "type" "DocumentType" NOT NULL,
    "title" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "storageKey" TEXT,
    "sizeBytes" INTEGER,
    "testDate" TIMESTAMP(3),
    "linkedMeasureKey" TEXT,
    "linkedSystem" "SystemKey",
    "recordedValues" JSONB,
    "status" TEXT NOT NULL DEFAULT 'READY',
    "failedAtPercent" INTEGER,
    "uploadedByName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessLog" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "actorName" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "resourceName" TEXT NOT NULL,
    "action" "AccessAction" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccessLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "clientId" TEXT,
    "type" "SessionType" NOT NULL,
    "title" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "durationMin" INTEGER NOT NULL DEFAULT 60,
    "status" "SessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "coachId" TEXT,
    "centreId" TEXT,
    "room" TEXT,
    "online" BOOLEAN NOT NULL DEFAULT false,
    "joinUrl" TEXT,
    "clientPlanId" TEXT,
    "planModuleId" TEXT,
    "assessmentId" TEXT,
    "sessionNumber" INTEGER,
    "rescheduledFromId" TEXT,
    "notNeeded" BOOLEAN NOT NULL DEFAULT false,
    "booked" INTEGER,
    "capacity" INTEGER,
    "beforeYouCome" JSONB NOT NULL DEFAULT '{}',
    "extraInfo" TEXT,
    "attachments" TEXT[],
    "checkedInAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "countsAgainstPlan" BOOLEAN NOT NULL DEFAULT true,
    "lateChange" BOOLEAN NOT NULL DEFAULT false,
    "cancelReason" TEXT,
    "bookedBy" TEXT NOT NULL DEFAULT 'client',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionEvent" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "status" "SessionStatus" NOT NULL,
    "note" TEXT,
    "byName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvailabilitySlot" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "centreId" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "minutes" INTEGER NOT NULL DEFAULT 60,
    "online" BOOLEAN NOT NULL DEFAULT false,
    "taken" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AvailabilitySlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionRating" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "sessionId" TEXT,
    "score" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IssueReport" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "sessionId" TEXT,
    "kind" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IssueReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "ProductKind" NOT NULL,
    "sessions" INTEGER,
    "validityDays" INTEGER,
    "pricePaise" INTEGER,
    "priceLabel" TEXT NOT NULL,
    "shopifyProductId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientPlan" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "sessionsTotal" INTEGER NOT NULL,
    "sessionsUsed" INTEGER NOT NULL DEFAULT 0,
    "coachId" TEXT,
    "renewalDecision" TEXT,
    "status" "ClientPlanStatus" NOT NULL DEFAULT 'ACTIVE',
    "goal" TEXT,
    "currentPhase" TEXT,
    "perWeek" TEXT,
    "focusAreas" TEXT[],

    CONSTRAINT "ClientPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramPhase" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "weeks" TEXT NOT NULL,
    "focus" TEXT NOT NULL,
    "exercises" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "ProgramPhase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductSuggestion" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "dismissed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ProductSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "productLine" TEXT,
    "paymentMethod" TEXT,
    "amountLabel" TEXT NOT NULL,
    "amountPaise" INTEGER,
    "placedAt" TIMESTAMP(3) NOT NULL,
    "shopifyId" TEXT,
    "syncStatus" "SyncStatus" NOT NULL DEFAULT 'SYNCED',

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "amountLabel" TEXT NOT NULL,
    "amountPaise" INTEGER,
    "gstRate" INTEGER NOT NULL DEFAULT 18,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'PAID',
    "issuedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Checkout" (
    "id" TEXT NOT NULL,
    "clientId" TEXT,
    "productSlug" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "returnTo" TEXT NOT NULL,
    "paidAt" TIMESTAMP(3),
    "orderNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Checkout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthSource" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "provider" "HealthProvider" NOT NULL,
    "status" "HealthSourceStatus" NOT NULL DEFAULT 'NOT_CONNECTED',
    "lastSyncAt" TIMESTAMP(3),
    "dataTypes" TEXT[],
    "sharedWithCoach" TEXT[],

    CONSTRAINT "HealthSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthSample" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "provider" "HealthProvider" NOT NULL,

    CONSTRAINT "HealthSample_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternalNote" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InternalNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutboxMessage" (
    "id" TEXT NOT NULL,
    "clientId" TEXT,
    "toAddress" TEXT NOT NULL,
    "channel" "Channel" NOT NULL,
    "template" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "status" "OutboxStatus" NOT NULL DEFAULT 'QUEUED',
    "sendAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutboxMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "clientId" TEXT,
    "actorName" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "actorName" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedView" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "filters" JSONB NOT NULL,

    CONSTRAINT "SavedView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationTemplate" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "channel" "Channel" NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,

    CONSTRAINT "NotificationTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "MfaVerification" (
    "sid" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MfaVerification_pkey" PRIMARY KEY ("sid")
);

-- CreateTable
CREATE TABLE "RescheduleRequest" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "slotStartsAt" TIMESTAMP(3) NOT NULL,
    "centreId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "late" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RescheduleRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeasureInsight" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "testKey" TEXT NOT NULL,
    "observations" JSONB NOT NULL DEFAULT '[]',
    "workOn" TEXT,
    "relatedLabel" TEXT,
    "relatedHref" TEXT,
    "evidenceDocIds" TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeasureInsight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachNote" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "assessmentId" TEXT,
    "system" "SystemKey",
    "scope" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "coachName" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SleepNight" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "bedtimeHour" DOUBLE PRECISION NOT NULL,
    "durationH" DOUBLE PRECISION NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'Self reported',

    CONSTRAINT "SleepNight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductHolding" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProductHolding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExportPackage" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'preparing',
    "fileCount" INTEGER,
    "sizeBytes" INTEGER,
    "storageKey" TEXT,
    "items" JSONB NOT NULL DEFAULT '[]',
    "preparedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExportPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataRequest" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'requested',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SetupToken" (
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL DEFAULT 'SETUP',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SetupToken_pkey" PRIMARY KEY ("tokenHash")
);

-- CreateTable
CREATE TABLE "LiveCue" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "timerSeconds" INTEGER,
    "label" TEXT,
    "timerStartedAt" TIMESTAMP(3),
    "timerStoppedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LiveCue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DayCheck" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "cameraOk" BOOLEAN,
    "micOk" BOOLEAN,
    "connection" TEXT,
    "linkTestedAt" TIMESTAMP(3),
    "joinedAt" TIMESTAMP(3),
    "lastSeenAt" TIMESTAMP(3),
    "reconnects" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DayCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduledReminder" (
    "id" TEXT NOT NULL,
    "outboxMessageId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "refId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScheduledReminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsentEvent" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "kind" "ConsentKind" NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'account',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientSessionPolicy" (
    "userId" TEXT NOT NULL,
    "sessionsValidAfter" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientSessionPolicy_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "SuggestionDetail" (
    "suggestionId" TEXT NOT NULL,
    "meta" TEXT NOT NULL,
    "testKey" TEXT,
    "findingId" TEXT,
    "productSlug" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "dismissedAt" TIMESTAMP(3),

    CONSTRAINT "SuggestionDetail_pkey" PRIMARY KEY ("suggestionId")
);

-- CreateTable
CREATE TABLE "OutboxDocument" (
    "messageId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "OutboxDocument_pkey" PRIMARY KEY ("messageId")
);

-- CreateTable
CREATE TABLE "DocumentView" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportView" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "step" INTEGER NOT NULL DEFAULT 0,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "walkthroughDoneAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConsoleFindingDraft_reportId_idx" ON "ConsoleFindingDraft"("reportId");

-- CreateIndex
CREATE UNIQUE INDEX "ConsoleFindingDraft_reportId_testKey_key" ON "ConsoleFindingDraft"("reportId", "testKey");

-- CreateIndex
CREATE UNIQUE INDEX "CaptureReview_clientId_moduleKey_key" ON "CaptureReview"("clientId", "moduleKey");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Centre_slug_key" ON "Centre"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "StaffProfile_userId_key" ON "StaffProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ClientProfile_userId_key" ON "ClientProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ClientProfile_code_key" ON "ClientProfile"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Consent_clientId_kind_key" ON "Consent"("clientId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "IntakeSection_clientId_key_key" ON "IntakeSection"("clientId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "ModuleTemplate_family_version_key" ON "ModuleTemplate"("family", "version");

-- CreateIndex
CREATE UNIQUE INDEX "PlanModule_planId_key_key" ON "PlanModule"("planId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "PlanVersion_planId_version_key" ON "PlanVersion"("planId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "TestDefinition_key_key" ON "TestDefinition"("key");

-- CreateIndex
CREATE UNIQUE INDEX "MeasureValue_clientOpId_key" ON "MeasureValue"("clientOpId");

-- CreateIndex
CREATE UNIQUE INDEX "MeasureValue_assessmentId_testKey_side_key" ON "MeasureValue"("assessmentId", "testKey", "side");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Order_number_key" ON "Order"("number");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_number_key" ON "Invoice"("number");

-- CreateIndex
CREATE UNIQUE INDEX "HealthSource_clientId_provider_key" ON "HealthSource"("clientId", "provider");

-- CreateIndex
CREATE INDEX "HealthSample_clientId_metric_date_idx" ON "HealthSample"("clientId", "metric", "date");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationTemplate_key_channel_key" ON "NotificationTemplate"("key", "channel");

-- CreateIndex
CREATE UNIQUE INDEX "MeasureInsight_clientId_testKey_key" ON "MeasureInsight"("clientId", "testKey");

-- CreateIndex
CREATE INDEX "LiveCue_assessmentId_createdAt_idx" ON "LiveCue"("assessmentId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DayCheck_sessionId_key" ON "DayCheck"("sessionId");

-- CreateIndex
CREATE INDEX "DayCheck_clientId_idx" ON "DayCheck"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduledReminder_outboxMessageId_key" ON "ScheduledReminder"("outboxMessageId");

-- CreateIndex
CREATE INDEX "ScheduledReminder_clientId_kind_idx" ON "ScheduledReminder"("clientId", "kind");

-- CreateIndex
CREATE INDEX "ScheduledReminder_refId_idx" ON "ScheduledReminder"("refId");

-- CreateIndex
CREATE INDEX "ConsentEvent_clientId_kind_createdAt_idx" ON "ConsentEvent"("clientId", "kind", "createdAt");

-- CreateIndex
CREATE INDEX "DocumentView_documentId_createdAt_idx" ON "DocumentView"("documentId", "createdAt");

-- CreateIndex
CREATE INDEX "ReportView_clientId_idx" ON "ReportView"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "ReportView_reportId_clientId_key" ON "ReportView"("reportId", "clientId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffProfile" ADD CONSTRAINT "StaffProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffCentre" ADD CONSTRAINT "StaffCentre_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffCentre" ADD CONSTRAINT "StaffCentre_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "Centre"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientProfile" ADD CONSTRAINT "ClientProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientProfile" ADD CONSTRAINT "ClientProfile_preferredCentreId_fkey" FOREIGN KEY ("preferredCentreId") REFERENCES "Centre"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientProfile" ADD CONSTRAINT "ClientProfile_primaryPractitionerId_fkey" FOREIGN KEY ("primaryPractitionerId") REFERENCES "StaffProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientCoach" ADD CONSTRAINT "ClientCoach_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientCoach" ADD CONSTRAINT "ClientCoach_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consent" ADD CONSTRAINT "Consent_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntakeSection" ADD CONSTRAINT "IntakeSection_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyFlag" ADD CONSTRAINT "SafetyFlag_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Injury" ADD CONSTRAINT "Injury_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BodyConcern" ADD CONSTRAINT "BodyConcern_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentPlan" ADD CONSTRAINT "AssessmentPlan_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanModule" ADD CONSTRAINT "PlanModule_planId_fkey" FOREIGN KEY ("planId") REFERENCES "AssessmentPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanModule" ADD CONSTRAINT "PlanModule_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ModuleTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanVersion" ADD CONSTRAINT "PlanVersion_planId_fkey" FOREIGN KEY ("planId") REFERENCES "AssessmentPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeasureValue" ADD CONSTRAINT "MeasureValue_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeasureValue" ADD CONSTRAINT "MeasureValue_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeasureValue" ADD CONSTRAINT "MeasureValue_testKey_fkey" FOREIGN KEY ("testKey") REFERENCES "TestDefinition"("key") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "StaffProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "StaffProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Finding" ADD CONSTRAINT "Finding_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewComment" ADD CONSTRAINT "ReviewComment_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewComment" ADD CONSTRAINT "ReviewComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "StaffProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetakeRequest" ADD CONSTRAINT "RetakeRequest_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessLog" ADD CONSTRAINT "AccessLog_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "StaffProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "Centre"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_clientPlanId_fkey" FOREIGN KEY ("clientPlanId") REFERENCES "ClientPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_planModuleId_fkey" FOREIGN KEY ("planModuleId") REFERENCES "PlanModule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionEvent" ADD CONSTRAINT "SessionEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionRating" ADD CONSTRAINT "SessionRating_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionRating" ADD CONSTRAINT "SessionRating_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueReport" ADD CONSTRAINT "IssueReport_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientPlan" ADD CONSTRAINT "ClientPlan_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientPlan" ADD CONSTRAINT "ClientPlan_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramPhase" ADD CONSTRAINT "ProgramPhase_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSuggestion" ADD CONSTRAINT "ProductSuggestion_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthSource" ADD CONSTRAINT "HealthSource_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthSample" ADD CONSTRAINT "HealthSample_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalNote" ADD CONSTRAINT "InternalNote_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalNote" ADD CONSTRAINT "InternalNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "StaffProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutboxMessage" ADD CONSTRAINT "OutboxMessage_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedView" ADD CONSTRAINT "SavedView_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RescheduleRequest" ADD CONSTRAINT "RescheduleRequest_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

