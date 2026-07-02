import { BANNED_PUBLIC_CLAIMS, STANDARD_TRUST_COPY } from "./claims";
import type { ToolMeta, ToolSource } from "./types";

const reviewedAt = "2026-07-02";

const incomeTaxTdsTransition: ToolSource = {
  title: "TDS Compliance - Form No. 168 transition",
  publisher: "Income Tax Department",
  url: "https://www.incometax.gov.in/iec/foportal/help/all-topics/e-filing-services/tds-compliance",
  sourceType: "official",
  jurisdiction: "IN",
  lastReviewedAt: reviewedAt,
  staleAfterDays: 30,
  usedFor: ["Form 168 transition notes", "TDS mismatch review boundary"],
};

const aisFaq: ToolSource = {
  title: "Annual Information Statement FAQ",
  publisher: "Income Tax Department",
  url: "https://www.incometax.gov.in/iec/foportal/ais-faq",
  sourceType: "official",
  jurisdiction: "IN",
  lastReviewedAt: reviewedAt,
  staleAfterDays: 30,
  usedFor: ["AIS/TIS feedback workflow", "Form 26AS boundary"],
};

const gstr2bManual: ToolSource = {
  title: "GSTR-2B User Manual",
  publisher: "GST Tutorials",
  url: "https://tutorial.gst.gov.in/userguide/returns/Manual_gstr2b.htm",
  sourceType: "official",
  jurisdiction: "IN",
  lastReviewedAt: reviewedAt,
  staleAfterDays: 30,
  usedFor: ["GSTR-2B inputs", "Excel/JSON download source basis"],
};

const msmeSamadhaan: ToolSource = {
  title: "MSME Samadhaan delayed payment monitoring system",
  publisher: "Ministry of MSME",
  url: "https://samadhaan.msme.gov.in/",
  sourceType: "official",
  jurisdiction: "IN",
  lastReviewedAt: reviewedAt,
  staleAfterDays: 30,
  usedFor: ["Delayed payment workflow", "MSEFC review context"],
};

const dcmsmeFaq: ToolSource = {
  title: "DC-MSME FAQ",
  publisher: "Development Commissioner MSME",
  url: "https://www.dcmsme.gov.in/old/faq/faq.htm",
  sourceType: "official",
  jurisdiction: "IN",
  lastReviewedAt: reviewedAt,
  staleAfterDays: 30,
  usedFor: ["Appointed day", "45-day payment review boundary"],
};

const gstSelfService: ToolSource = {
  title: "GST self-service complaint portal",
  publisher: "GST System",
  url: "https://selfservice.gstsystem.in/",
  sourceType: "official",
  jurisdiction: "IN",
  lastReviewedAt: reviewedAt,
  staleAfterDays: 30,
  usedFor: ["Portal issue evidence workflow context"],
};

const dpdpAct: ToolSource = {
  title: "Digital Personal Data Protection Act, 2023",
  publisher: "Government of India eGazette",
  url: "https://egazette.gov.in/WriteReadData/2023/248045.pdf",
  sourceType: "official",
  jurisdiction: "IN",
  lastReviewedAt: reviewedAt,
  staleAfterDays: 180,
  usedFor: ["Privacy posture", "Review copy limitation notes"],
};

export const TOOLS: ToolMeta[] = [
  {
    slug: "/msme-45-day-payment-due-date-calculator",
    h1: "MSME 45-Day Payment Due Date Calculator",
    seoTitle: "MSME 45-Day Payment Due Date Calculator | Udyam Evidence",
    metaDescription:
      "Check possible MSME 15/45-day payment flags and prepare Udyam evidence requests before professional review.",
    title: "MSME 45-Day Payment Due Date Calculator",
    status: "mvp",
    audiences: ["MSMEs", "CFOs", "founders", "CAs", "CSs", "CMAs"],
    privacyMode: "browser-only",
    accountRequired: false,
    fileUploadRequired: false,
    telemetry: "none",
    supportedInputs: ["pasted CSV rows", "manual payables table"],
    unsupportedCases: [
      "Does not verify Udyam status on government portals.",
      "Does not decide final interest, disallowance, or legal default.",
    ],
    outputArtifacts: [
      "plain-text due-date review draft",
      "Udyam confirmation request text",
      "management review note",
    ],
    officialSources: [msmeSamadhaan, dcmsmeFaq],
    axalUpgradePath:
      "Track recurring MSME payables, evidence, reminders, and review tasks in Axal.",
    trustCopy: STANDARD_TRUST_COPY,
    bannedClaims: BANNED_PUBLIC_CLAIMS,
  },
  {
    slug: "/gstr-2b-missing-invoice-vendor-follow-up",
    h1: "GSTR-2B Missing Invoice Follow-up Generator",
    seoTitle: "GSTR-2B Missing Invoice Vendor Follow-up Generator",
    metaDescription:
      "Create supplier-wise follow-up drafts when purchase invoices are missing from GSTR-2B.",
    title: "GSTR-2B Missing Invoice Follow-up Generator",
    status: "mvp",
    audiences: ["CAs", "GST teams", "accountants", "MSMEs"],
    privacyMode: "browser-only",
    accountRequired: false,
    fileUploadRequired: false,
    telemetry: "none",
    supportedInputs: ["pasted supplier issue rows", "manual purchase-register table"],
    unsupportedCases: [
      "Does not determine ITC eligibility.",
      "Does not produce GSTR-3B-ready filing numbers.",
    ],
    outputArtifacts: ["supplier chase text", "email draft", "WhatsApp-ready draft text"],
    officialSources: [gstr2bManual],
    axalUpgradePath:
      "Run recurring reconciliation, supplier tasks, IMS tracking, and review workflow in Axal.",
    trustCopy: STANDARD_TRUST_COPY,
    bannedClaims: BANNED_PUBLIC_CLAIMS,
  },
  {
    slug: "/ais-form-26as-mismatch-checker",
    h1: "AIS and Form 26AS Mismatch Checker",
    seoTitle: "AIS and Form 26AS Mismatch Checker",
    metaDescription:
      "Prepare an AIS/Form 26AS mismatch table and correction request drafts before filing review.",
    title: "AIS and Form 26AS Mismatch Checker",
    status: "mvp",
    audiences: ["taxpayers", "CAs", "tax preparers", "finance teams"],
    privacyMode: "browser-only",
    accountRequired: false,
    fileUploadRequired: false,
    telemetry: "none",
    supportedInputs: ["pasted AIS summary rows", "manual Form 26AS comparison table"],
    unsupportedCases: [
      "Does not compute ITR tax payable or refunds.",
      "Does not upload AIS feedback or submit portal corrections.",
    ],
    outputArtifacts: [
      "plain-text mismatch table",
      "review checklist text",
      "deductor correction draft",
    ],
    officialSources: [aisFaq, incomeTaxTdsTransition],
    axalUpgradePath:
      "Manage client evidence, review tasks, document vault, and tax-fact history in Axal.",
    trustCopy: STANDARD_TRUST_COPY,
    bannedClaims: BANNED_PUBLIC_CLAIMS,
  },
  {
    slug: "/gst-portal-issue-evidence-memo",
    h1: "GST Portal Issue Evidence Memo Builder",
    seoTitle: "GST Portal Issue Evidence Memo Builder",
    metaDescription:
      "Create a user-observed GST filing-attempt memo from manual timestamps, error labels, and retry notes.",
    title: "GST Portal Issue Evidence Memo Builder",
    status: "mvp",
    audiences: ["CAs", "GST consultants", "businesses"],
    privacyMode: "browser-only",
    accountRequired: false,
    fileUploadRequired: false,
    telemetry: "none",
    supportedInputs: ["manual attempt timestamps", "error labels", "manual notes"],
    unsupportedCases: [
      "Does not prove the GST portal was globally unavailable.",
      "Does not guarantee extension, waiver, or condonation.",
    ],
    outputArtifacts: ["attempt timeline text", "client note", "retry checklist"],
    officialSources: [gstSelfService],
    axalUpgradePath:
      "Attach evidence to obligations, matters, document vault, and task follow-up in Axal.",
    trustCopy: STANDARD_TRUST_COPY,
    bannedClaims: BANNED_PUBLIC_CLAIMS,
  },
  {
    slug: "/privacy/review-copy-builder",
    h1: "Review Copy Builder",
    seoTitle: "Review Copy Builder for Compliance Records",
    metaDescription:
      "Create a flattened review copy before sharing compliance records for professional review.",
    title: "Review Copy Builder",
    status: "mvp",
    audiences: ["CAs", "CSs", "CMAs", "founders", "finance teams"],
    privacyMode: "browser-only",
    accountRequired: false,
    fileUploadRequired: false,
    telemetry: "none",
    supportedInputs: ["plain text"],
    unsupportedCases: [
      "Does not perform browser OCR in V0.",
      "Does not provide forensic or legally irreversible redaction.",
    ],
    outputArtifacts: ["masked text draft", "review footer"],
    officialSources: [dpdpAct],
    axalUpgradePath:
      "Use approved templates, source footers, evidence trails, and professional-controlled sends in Axal.",
    trustCopy: STANDARD_TRUST_COPY,
    bannedClaims: BANNED_PUBLIC_CLAIMS,
  },
];
