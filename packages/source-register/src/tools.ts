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

const msmeSamadhaanFaq: ToolSource = {
  title: "MSME Samadhaan delayed payment FAQ",
  publisher: "Ministry of MSME",
  url: "https://samadhaan.msme.gov.in/MyMsme/MSEFC/FAQ.aspx",
  sourceType: "official",
  jurisdiction: "IN",
  lastReviewedAt: reviewedAt,
  staleAfterDays: 30,
  usedFor: [
    "Udyam evidence context",
    "prior-registration review prompt",
    "work-order and dispute caveats",
  ],
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
    h1: "MSME Payables Age Triage",
    seoTitle: "MSME Payables Candidate Marker Triage | Udyam Evidence",
    metaDescription:
      "Prepare MSME payables candidate-marker review notes with agreement, objection, payment, and Udyam evidence prompts.",
    title: "MSME Payables Age Triage",
    status: "mvp",
    audiences: ["MSMEs", "CFOs", "founders", "CAs", "CSs", "CMAs"],
    privacyMode: "browser-only",
    accountRequired: false,
    fileUploadRequired: false,
    telemetry: "none",
    supportedInputs: [
      "pasted CSV/TSV rows",
      "manual payables table",
      "optional agreement, payment, objection, dispute, Udyam evidence, Udyam registration date, and open balance context columns",
    ],
    unsupportedCases: [
      "Does not verify Udyam registration or supplier MSE status on government portals.",
      "Does not decide statutory interest, default, tax disallowance, or legal recovery action.",
      "Does not resolve disputed, partly paid, settled, or admissibility positions.",
      "Does not prepare an MSEFC or ODR filing package.",
    ],
    outputArtifacts: [
      "plain-text payables candidate review marker draft",
      "Udyam confirmation request text",
      "missing-facts checklist",
      "management review note",
    ],
    officialSources: [msmeSamadhaan, msmeSamadhaanFaq, dcmsmeFaq],
    relatedSlugs: [
      "/gstr-2b-purchase-reconciliation-triage",
      "/ais-form-26as-mismatch-checker",
    ],
    axalUpgradePath:
      "Track recurring MSME payables, evidence, reminders, and review tasks in Axal.",
    seoDepth: {
      inputGuide: [
        "Use one row per payable with vendor, amount, and acceptanceDate or deemedAcceptanceDate. Invoice date is accepted only as a screening fallback when acceptance evidence is missing.",
        "Optional columns include writtenAgreement, agreedPaymentDays, paymentDate, paidAmount, open balance context, objectionRaisedDate, objectionResolvedDate, disputeStatus, udyamEvidence, and Udyam registration date.",
        "Use YYYY-MM-DD dates where possible; blank or invalid dates are kept for manual review.",
      ],
      exampleWorkflow: [
        "Paste the open-payables rows from a spreadsheet export.",
        "Set the review as-of date for the meeting or management note.",
        "Download the first-pass draft and attach invoices, Udyam evidence, agreements, payments, and dispute correspondence separately.",
      ],
      commonMistakes: [
        "Treating invoice date as acceptance date when acceptance or deemed acceptance needs separate review.",
        "Using the output as an interest, default, tax, or filing decision without checking supplier status, prior Udyam evidence, agreement terms, and dispute/payment context.",
      ],
      reviewChecklist: [
        "Confirm whether the supplier is an MSME and whether Udyam evidence, including Udyam registration date context, is available.",
        "Check whether written payment terms exist and whether the acceptance/deemed acceptance date behind the candidate marker is supportable.",
        "Review objection, disputed, paid, partly paid, and open balance context separately before sending a management note.",
      ],
      sourceExplainer:
        "MSME source links are used to frame delayed-payment review boundaries, Udyam evidence prompts, and dispute caveats, not to decide final interest, tax, or recovery outcomes.",
      faqItems: [
        {
          question: "Why is this called age triage instead of a due-date calculator?",
          answer:
            "The V0 output uses pasted dates and user-entered agreement/payment context to create review prompts. It keeps Udyam status, disputes, payments, and tax treatment for professional review.",
        },
        {
          question: "Can I use this for 43B(h) conclusions?",
          answer:
            "No. Use the draft as a working note and verify supplier status, accounting treatment, and professional judgment before any tax position.",
        },
      ],
    },
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
    supportedInputs: [
      "pasted supplier issue rows",
      "manual purchase-register table",
      "optional GSTIN, invoice date, tax period, document type, taxable value, tax amount, and escalation columns",
    ],
    unsupportedCases: [
      "Does not determine ITC eligibility.",
      "Does not produce GSTR-3B-ready filing numbers.",
    ],
    outputArtifacts: [
      "supplier-wise issue packet",
      "email draft",
      "WhatsApp-ready summary",
      "manual send checklist",
    ],
    officialSources: [gstr2bManual],
    relatedSlugs: [
      "/gstr-2b-purchase-reconciliation-triage",
      "/gst-portal-issue-evidence-memo",
    ],
    axalUpgradePath:
      "Run recurring reconciliation, supplier tasks, IMS tracking, and review workflow in Axal.",
    seoDepth: {
      inputGuide: [
        "Use one row per supplier issue with supplier, invoice, and status.",
        "Add GSTIN, invoiceDate, taxPeriod, documentType, taxableValue, taxAmount, and escalationLevel when available so the draft is easier for vendors to verify.",
      ],
      exampleWorkflow: [
        "Paste missing or mismatched invoices from a reconciliation sheet.",
        "Review the supplier-wise email and WhatsApp-ready draft and remove rows that should not be chased.",
        "Send the final text through your normal professional communication channel.",
      ],
      commonMistakes: [
        "Chasing a vendor before checking whether the invoice number was normalized differently.",
        "Using a generic message when the supplier needs exact invoice, date, and amount context.",
      ],
      reviewChecklist: [
        "Confirm invoice number, date, GSTIN, tax period, document type, taxable value, and tax amount against books.",
        "Separate missing invoices from value mismatches before sending.",
        "Record supplier responses in Axal or another controlled workflow when follow-up becomes recurring.",
      ],
      sourceExplainer:
        "The GSTR-2B source is used to explain the review context for supplier follow-up, not to decide credit positions.",
      faqItems: [
        {
          question: "Does this send messages to suppliers?",
          answer:
            "No. It creates browser-local draft text only. You choose whether and how to send it.",
        },
        {
          question: "Should I paste full supplier ledgers?",
          answer:
            "No. Paste only the issue rows needed for the draft and keep supporting records in your normal review file.",
        },
      ],
    },
    trustCopy: STANDARD_TRUST_COPY,
    bannedClaims: BANNED_PUBLIC_CLAIMS,
  },
  {
    slug: "/gstr-2b-purchase-reconciliation-triage",
    h1: "GSTR-2B Purchase Reconciliation Triage",
    seoTitle: "GSTR-2B Purchase Reconciliation Triage",
    metaDescription:
      "Compare pasted purchase-register and GSTR-2B rows into exception buckets before professional review.",
    title: "GSTR-2B Purchase Reconciliation Triage",
    status: "mvp",
    audiences: ["CAs", "GST teams", "accountants", "finance controllers"],
    privacyMode: "browser-only",
    accountRequired: false,
    fileUploadRequired: false,
    telemetry: "none",
    supportedInputs: [
      "pasted purchase-register rows",
      "pasted GSTR-2B rows",
      "manual tax-amount comparison table",
      "optional invoice date, document type, amendment table, ITC availability, and IMS status columns",
    ],
    unsupportedCases: [
      "Does not determine ITC eligibility or filing positions.",
      "Does not replace recurring reconciliation, IMS actions, or books updates.",
    ],
    outputArtifacts: [
      "exception bucket summary",
      "supplier follow-up draft basis",
      "review checklist text",
    ],
    officialSources: [gstr2bManual],
    relatedSlugs: [
      "/gstr-2b-missing-invoice-vendor-follow-up",
      "/gst-portal-issue-evidence-memo",
    ],
    axalUpgradePath:
      "Use Axal for saved mappings, recurring reconciliation, IMS tracking, supplier tasks, and review workflow.",
    seoDepth: {
      inputGuide: [
        "Paste purchase-register and GSTR-2B rows together with a source column set to purchase or 2b.",
        "Include supplier or GSTIN, invoice, and taxAmount. Add invoice date, document type, amendment table, ITC availability, and IMS status when available for professional-mode review.",
      ],
      exampleWorkflow: [
        "Paste a small reconciliation slice from books and GSTR-2B.",
        "Review missing, extra, mismatch, duplicate, and matched buckets.",
        "Use the exception list as a working basis for supplier follow-up or deeper Axal reconciliation.",
      ],
      commonMistakes: [
        "Comparing only invoice numbers when supplier GSTIN or invoice date differs.",
        "Treating a matched tax amount as a final credit decision without reviewing document type and portal state.",
        "Ignoring amendment, ITC availability, IMS, or reverse-charge context when the amount appears to match.",
      ],
      reviewChecklist: [
        "Check duplicate keys before acting on missing or extra buckets.",
        "Review amount differences against tax components and invoice amendments.",
        "Review ITC availability, IMS status, amendment table, document type, and reverse-charge columns when the export includes them.",
        "Move large, recurring, or IMS-linked reconciliations into Axal for saved mappings and review history.",
      ],
      sourceExplainer:
        "The GSTR-2B source is used for input context and review boundaries; the V0 triage remains a first-pass comparison.",
      faqItems: [
        {
          question: "What tolerance does the triage use?",
          answer:
            "The V0 workbench uses a small default tax-amount tolerance and surfaces rows outside that range for review.",
        },
        {
          question: "Does this cover IMS actions?",
          answer:
            "No. Professional mode can flag pasted IMS/ITC context when present, but IMS actions still need saved context and professional workflow.",
        },
      ],
    },
    trustCopy: STANDARD_TRUST_COPY,
    bannedClaims: BANNED_PUBLIC_CLAIMS,
  },
  {
    slug: "/ais-form-26as-mismatch-checker",
    h1: "AIS and Form 26AS Mismatch Checker",
    seoTitle: "AIS and Form 26AS Mismatch Checker",
    metaDescription:
      "Prepare AIS/Form 26AS mismatch categories and deductor-wise verification drafts before tax-record review.",
    title: "AIS and Form 26AS Mismatch Checker",
    status: "mvp",
    audiences: ["taxpayers", "CAs", "tax preparers", "finance teams"],
    privacyMode: "browser-only",
    accountRequired: false,
    fileUploadRequired: false,
    telemetry: "none",
    supportedInputs: [
      "pasted AIS summary rows",
      "manual Form 26AS comparison table",
      "optional deductor, TAN, section, income category, TDS/TCS, amount in books, mismatch category, and review action columns",
    ],
    unsupportedCases: [
      "Does not compute ITR tax payable or refunds.",
      "Does not upload AIS feedback or submit portal corrections.",
    ],
    outputArtifacts: [
      "plain-text mismatch category table",
      "review checklist text",
      "deductor-wise verification draft",
    ],
    officialSources: [aisFaq, incomeTaxTdsTransition],
    relatedSlugs: [
      "/msme-45-day-payment-due-date-calculator",
      "/privacy/review-copy-builder",
    ],
    axalUpgradePath:
      "Manage client evidence, review tasks, document vault, and tax-fact history in Axal.",
    seoDepth: {
      inputGuide: [
        "Use one row per AIS/Form 26AS mismatch with source, category, amount, recordsAmount, and note.",
        "Add deductor, TAN, section, income category, TDS/TCS amount, mismatch category, and reviewAction when available so the draft points to the next review step.",
      ],
      exampleWorkflow: [
        "Paste a small mismatch list from AIS, Form 26AS, or a working sheet.",
        "Review amount differences and classify what needs deductor or portal follow-up.",
        "Download the draft and verify against the taxpayer records before filing review.",
      ],
      commonMistakes: [
        "Mixing AIS and Form 26AS rows without marking the source.",
        "Sending a correction request before checking section, TAN, and income category.",
        "Treating duplicate, omitted, or incorrect-category rows as tax computation conclusions.",
      ],
      reviewChecklist: [
        "Check source, TAN, section, amount, and recordsAmount for every row.",
        "Separate duplicate, omitted, amount mismatch, and incorrect category cases before deductor follow-up.",
        "Confirm TDS/TCS amount and income category against taxpayer records before portal feedback.",
        "Keep taxpayer evidence and portal screenshots in a controlled workpaper or Axal.",
      ],
      sourceExplainer:
        "Income Tax sources are used to frame AIS/Form 26AS review context and feedback boundaries, not to compute final return outcomes.",
      faqItems: [
        {
          question: "Does this upload AIS feedback?",
          answer:
            "No. It creates a local review draft. Portal feedback or deductor correction must be handled separately.",
        },
        {
          question: "Can this calculate my refund or tax payable?",
          answer:
            "No. It only organizes mismatch rows for review before a professional return workflow.",
        },
      ],
    },
    trustCopy: STANDARD_TRUST_COPY,
    bannedClaims: BANNED_PUBLIC_CLAIMS,
  },
  {
    slug: "/gst-portal-issue-evidence-memo",
    h1: "GST Portal Issue Evidence Memo Builder",
    seoTitle: "GST Portal Issue Evidence Memo Builder",
    metaDescription:
      "Create a user-observed GST filing-attempt memo with timestamps, error labels, retry notes, and evidence references.",
    title: "GST Portal Issue Evidence Memo Builder",
    status: "mvp",
    audiences: ["CAs", "GST consultants", "businesses"],
    privacyMode: "browser-only",
    accountRequired: false,
    fileUploadRequired: false,
    telemetry: "none",
    supportedInputs: [
      "manual attempt timestamps",
      "error labels",
      "manual notes",
      "optional screenshot hash, screenshot reference, complaint reference, browser, device, timezone, retry count, and network context",
    ],
    unsupportedCases: [
      "Does not prove the GST portal was globally unavailable.",
      "Does not guarantee extension, waiver, or condonation.",
      "Does not accept screenshots, files, PDFs, base64, local paths, GSTINs, OTPs, cookies, or credentials, and does not compute or verify hashes.",
    ],
    outputArtifacts: [
      "attempt timeline text",
      "client note",
      "retry checklist",
      "user-entered evidence reference checklist",
    ],
    officialSources: [gstSelfService],
    relatedSlugs: [
      "/privacy/review-copy-builder",
      "/gstr-2b-missing-invoice-vendor-follow-up",
    ],
    axalUpgradePath:
      "Attach evidence to obligations, matters, document vault, and task follow-up in Axal.",
    seoDepth: {
      inputGuide: [
        "Use one row per attempt with attemptedAt, action, and error.",
        "Add timezone, retryCount, complaintReference, screenshot reference, screenshot hash, browser, device, and networkContext when available.",
      ],
      exampleWorkflow: [
        "Record each portal attempt close to the time it happened.",
        "Paste the attempt timeline and review the user-observed memo.",
        "Attach screenshots or complaint references in your controlled evidence file or Axal matter.",
      ],
      commonMistakes: [
        "Writing a broad outage claim when only a user-observed attempt was recorded.",
        "Leaving out timezone, browser context, or complaint reference from the working note.",
        "Treating a pasted screenshot hash as verified evidence when this tool only records user-entered references.",
      ],
      reviewChecklist: [
        "Confirm timestamps and timezone before sharing the memo.",
        "Separate user errors, browser issues, and portal errors where possible.",
        "Confirm any screenshot hash against the retained original file.",
        "Keep original screenshots or ticket references outside the pasted draft.",
      ],
      sourceExplainer:
        "GST self-service source links are used for complaint workflow context; the memo records only user-entered observations.",
      faqItems: [
        {
          question: "Does this prove the GST portal was down for everyone?",
          answer:
            "No. It records user-entered attempts and should be reviewed with supporting evidence.",
        },
        {
          question: "Can I attach screenshots here?",
          answer:
            "No. V0 accepts text rows only. Keep screenshots in your evidence folder or Axal.",
        },
        {
          question: "Does a screenshot hash verify the screenshot?",
          answer:
            "No. Screenshot names and hashes are user-entered references only. This tool does not inspect, upload, authenticate, or verify screenshots.",
        },
      ],
    },
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
      "Does not guarantee detection of partial, non-standard, or contextual identifiers.",
      "Does not inspect file names, client references, screenshots, PDFs, or scanned text.",
    ],
    outputArtifacts: [
      "masked text draft",
      "mask report",
      "manual review checklist",
      "review footer",
    ],
    officialSources: [dpdpAct],
    relatedSlugs: [
      "/gst-portal-issue-evidence-memo",
      "/ais-form-26as-mismatch-checker",
    ],
    axalUpgradePath:
      "Use approved templates, source footers, evidence trails, and professional-controlled sends in Axal.",
    seoDepth: {
      inputGuide: [
        "Paste plain text only; do not paste images, PDFs, or full client records.",
        "Review the mask report and manually check names, addresses, screenshots, and scanned text.",
      ],
      exampleWorkflow: [
        "Paste the smallest review excerpt needed for handoff.",
        "Check the masked text and the found/masked/not-checked report.",
        "Remove or rewrite any remaining personal or client context before sharing.",
      ],
      commonMistakes: [
        "Assuming pattern masking catches names, addresses, PDFs, screenshots, or scanned text.",
        "Sharing the draft before checking whether the placeholders changed the meaning.",
      ],
      reviewChecklist: [
        "Check PAN, TAN, GSTIN, CIN, Udyam, DIN/DPIN, LLPIN, Aadhaar-like, bank, email, phone, and UPI placeholders.",
        "Manually inspect names, addresses, file names, and contextual identifiers.",
        "Use Axal templates and review trails for controlled recurring handoffs.",
      ],
      sourceExplainer:
        "The DPDP source is used for privacy posture context; this tool remains a simple text-pattern masking helper.",
      faqItems: [
        {
          question: "Is this irreversible redaction?",
          answer:
            "No. It masks common text patterns and produces a review copy that still needs manual checking.",
        },
        {
          question: "Does this inspect screenshots or PDFs?",
          answer:
            "No. V0 only processes plain text pasted into the browser field.",
        },
      ],
    },
    trustCopy: STANDARD_TRUST_COPY,
    bannedClaims: BANNED_PUBLIC_CLAIMS,
  },
];
