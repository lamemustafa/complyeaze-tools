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

const cgstRule88c: ToolSource = {
  title: "CGST Rules, 2017 - Rule 88C (difference in liability reported in GSTR-1 and GSTR-3B)",
  publisher: "CBIC (Central Board of Indirect Taxes and Customs)",
  url: "https://taxinformation.cbic.gov.in/content/html/tax_repository/gst/rules/cgst_rules/active/chapter9/rule88c_v1.00.html",
  sourceType: "official",
  jurisdiction: "IN",
  lastReviewedAt: reviewedAt,
  staleAfterDays: 30,
  usedFor: ["Rule 88C mechanics", "seven-day reply window"],
};

const cgstRule59: ToolSource = {
  title: "CGST Rules, 2017 - Rule 59 (Form and manner of furnishing details of outward supplies)",
  publisher: "CBIC (Central Board of Indirect Taxes and Customs)",
  url: "https://taxinformation.cbic.gov.in/content/html/tax_repository/gst/rules/cgst_rules/active/chapter8/rule59_v1.00.html",
  sourceType: "official",
  jurisdiction: "IN",
  lastReviewedAt: reviewedAt,
  staleAfterDays: 30,
  usedFor: ["GSTR-1/IFF filing block after an unresolved Rule 88C intimation"],
};

const drc01bFaq: ToolSource = {
  title: "FAQs on Return Compliance in Form DRC-01B",
  publisher: "GSTN (Goods and Services Tax Network)",
  url: "https://tutorial.gst.gov.in/downloads/news/return_compliance_in_form_drc_01b.pdf",
  sourceType: "official",
  jurisdiction: "IN",
  lastReviewedAt: reviewedAt,
  staleAfterDays: 30,
  usedFor: ["Per-period comparison logic", "reply mechanics"],
};

const gstr3bTable31Advisory: ToolSource = {
  title: "Advisory regarding non-editable auto-populated liability in GSTR-3B",
  publisher: "GSTN (mirrored by Maharashtra GST Department)",
  url: "https://www.mahagst.gov.in/public/uploads/gstnadvisory/1760596521_352%20Advisory%20regarding%20non-editable%20of%20auto-populated%20liability%20in%20GSTR-3B.pdf",
  sourceType: "official",
  jurisdiction: "IN",
  lastReviewedAt: reviewedAt,
  staleAfterDays: 30,
  usedFor: ["Table 3.1 lock effective tax period"],
};

const gstr3bTable32Advisory: ToolSource = {
  title: "Advisory on reporting values in Table 3.2 of GSTR-3B (19 July 2025)",
  publisher: "GSTN (mirrored by Maharashtra GST Department)",
  url: "https://www.mahagst.gov.in/public/uploads/gstnadvisory/1760529178_364%20Advisory%20on%20reporting%20values%20in%20Table%203.2%20of%20GSTR-3B.pdf",
  sourceType: "official",
  jurisdiction: "IN",
  lastReviewedAt: reviewedAt,
  staleAfterDays: 30,
  usedFor: ["Table 3.2 lock effective tax period"],
};

const gstr1aFaq: ToolSource = {
  title: "FAQ on GSTR-1A - Amendment to GSTR-1",
  publisher: "GSTN (Goods and Services Tax Network)",
  url: "https://tutorial.gst.gov.in/downloads/news/creative_faqs_on_gstr1a_fo_cr25785.pdf",
  sourceType: "official",
  jurisdiction: "IN",
  lastReviewedAt: reviewedAt,
  staleAfterDays: 30,
  usedFor: ["GSTR-1A pre-filing correction window"],
};

const incomeTaxAct2025Gazette: ToolSource = {
  title: "The Income-tax Act, 2025 (No. 30 of 2025)",
  publisher: "Gazette of India / Ministry of Law and Justice",
  url: "https://egazette.gov.in/WriteReadData/2025/265620.pdf",
  sourceType: "official",
  jurisdiction: "IN",
  lastReviewedAt: reviewedAt,
  staleAfterDays: 30,
  usedFor: ["Section 392/393/394 TDS and TCS structure"],
};

const tdsComplianceHelp: ToolSource = {
  title: "TDS Compliance (Income-tax Act 2025 transition)",
  publisher: "Income Tax Department",
  url: "https://www.incometax.gov.in/iec/foportal/help/all-topics/e-filing-services/tds-compliance",
  sourceType: "official",
  jurisdiction: "IN",
  lastReviewedAt: reviewedAt,
  staleAfterDays: 30,
  usedFor: ["Section 393 Table/Serial Number citation format"],
};

const schedule112aCsvInstructions: ToolSource = {
  title: "Instructions for filling Schedule 112A/115AD(1)(b)(iii)(P)",
  publisher: "Income Tax Department",
  url: "https://static.incometax.gov.in/iec/foservices/assets/itr-shared/documents/112A_115AD_CSV_Instructions.pdf",
  sourceType: "official",
  jurisdiction: "IN",
  lastReviewedAt: reviewedAt,
  staleAfterDays: 30,
  usedFor: ["Schedule 112A column structure", "grandfathering formula"],
};

const itr2ValidationRulesAy2025: ToolSource = {
  title: "ITR 2 - Validation Rules for AY 2025-26, V1.0",
  publisher: "CBDT (Central Board of Direct Taxes)",
  url: "https://www.incometax.gov.in/iec/foportal/sites/default/files/2025-07/CBDT__e-Filing_ITR%202_Validation%20Rules_AY%202025-26_V1.0.pdf",
  sourceType: "official",
  jurisdiction: "IN",
  lastReviewedAt: reviewedAt,
  staleAfterDays: 30,
  usedFor: ["Live-required before/on-or-after 23 July 2024 column not shown in the older CSV instructions PDF"],
};

const financeAct2024Gazette: ToolSource = {
  title: "The Finance (No. 2) Act, 2024",
  publisher: "Gazette of India / Ministry of Law and Justice",
  url: "https://egazette.gov.in/WriteReadData/2024/256436.pdf",
  sourceType: "official",
  jurisdiction: "IN",
  lastReviewedAt: reviewedAt,
  staleAfterDays: 30,
  usedFor: ["23 July 2024 LTCG/STCG rate cutover"],
};

const codeOnWages: ToolSource = {
  title: "The Code on Wages, 2019 - Section 2(y)",
  publisher: "Ministry of Labour and Employment",
  url: "https://www.labour.gov.in/static/uploads/2025/06/c328da14bbb15fc4ad571dc33e7a4ab3.pdf",
  sourceType: "official",
  jurisdiction: "IN",
  lastReviewedAt: reviewedAt,
  staleAfterDays: 30,
  usedFor: ["Wages definition and the 50% add-back proviso"],
};

const codeOnSocialSecurity: ToolSource = {
  title: "The Code on Social Security, 2020 - Section 53 (as on 21 November 2025)",
  publisher: "India Code / Ministry of Law and Justice",
  url: "https://www.indiacode.nic.in/bitstream/123456789/16823/1/aA2020-36.pdf",
  sourceType: "official",
  jurisdiction: "IN",
  lastReviewedAt: reviewedAt,
  staleAfterDays: 30,
  usedFor: ["Gratuity formula, eligibility, and notified cap"],
};

const labourCodeFaqMarch2026: ToolSource = {
  title: "Additional FAQs on Labour Codes (as on 16.03.2026)",
  publisher: "Ministry of Labour and Employment",
  url: "https://www.labour.gov.in/static/uploads/2026/03/a4ccf4c6d97c4f1f36a6d83f8c64213d.pdf",
  sourceType: "official",
  jurisdiction: "IN",
  lastReviewedAt: reviewedAt,
  staleAfterDays: 30,
  usedFor: ["50% wage rule worked example", "fixed-term gratuity threshold"],
};

const mahareraForm3: ToolSource = {
  title: "Form 3 - Chartered Accountant's Certificate for Withdrawal from Designated Account",
  publisher: "MahaRERA (Maharashtra Real Estate Regulatory Authority)",
  url: "https://maharera.maharashtra.gov.in/sites/default/files/inline-files/Form%203.pdf",
  sourceType: "official",
  jurisdiction: "IN",
  lastReviewedAt: reviewedAt,
  staleAfterDays: 30,
  usedFor: ["Form 3 line-item structure and withdrawal ceiling formula"],
};

export const TOOLS: ToolMeta[] = [
  {
    slug: "/msme-45-day-payment-due-date-calculator",
    h1: "MSME Payables Age Triage",
    seoTitle: "MSME 45-Day Payables Age Triage | Udyam Evidence",
    metaDescription:
      "Check possible MSME 15/45-day payment flags and prepare Udyam evidence requests before professional review.",
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
      "optional agreement, payment, dispute, and Udyam evidence columns",
    ],
    unsupportedCases: [
      "Does not verify Udyam registration or supplier MSE status on government portals.",
      "Does not decide statutory interest, default, tax disallowance, or legal recovery action.",
      "Does not resolve disputed, partly paid, settled, or admissibility positions.",
      "Does not prepare an MSEFC or ODR filing package.",
    ],
    outputArtifacts: [
      "plain-text payables age review draft",
      "Udyam confirmation request text",
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
        "Use one row per payable with vendor, amount, and acceptanceDate or deemedAcceptanceDate.",
        "Optional columns include writtenAgreement, agreedPaymentDays, paymentDate, paidAmount, disputeStatus, and udyamEvidence.",
        "Use YYYY-MM-DD dates where possible; blank or invalid dates are kept for manual review.",
      ],
      exampleWorkflow: [
        "Paste the open-payables rows from a spreadsheet export.",
        "Set the review as-of date for the meeting or management note.",
        "Download the first-pass draft and attach invoices, Udyam evidence, agreements, payments, and dispute correspondence separately.",
      ],
      commonMistakes: [
        "Treating invoice date as acceptance date when acceptance or deemed acceptance needs separate review.",
        "Using the output as an interest/default decision without checking supplier status and agreement terms.",
      ],
      reviewChecklist: [
        "Confirm whether the supplier is an MSME and whether Udyam evidence is available.",
        "Check whether written payment terms exist and whether the acceptance date is supportable.",
        "Review disputed, paid, or partly paid invoices separately before sending a management note.",
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
    supportedInputs: ["pasted supplier issue rows", "manual purchase-register table"],
    unsupportedCases: [
      "Does not determine ITC eligibility.",
      "Does not produce GSTR-3B-ready filing numbers.",
    ],
    outputArtifacts: ["supplier chase text", "email draft", "WhatsApp-ready draft text"],
    officialSources: [gstr2bManual],
    relatedSlugs: [
      "/gstr-2b-purchase-reconciliation-triage",
      "/gst-portal-issue-evidence-memo",
    ],
    axalUpgradePath:
      "Run recurring reconciliation, supplier tasks, IMS tracking, and review workflow in Axal.",
    seoDepth: {
      inputGuide: [
        "Use one row per supplier issue with supplier, invoice, amount, and status.",
        "Add GSTIN, invoiceDate, and taxAmount when available so the draft is easier for vendors to verify.",
      ],
      exampleWorkflow: [
        "Paste missing or mismatched invoices from a reconciliation sheet.",
        "Review the supplier-wise grouped draft and remove rows that should not be chased.",
        "Send the final text through your normal professional communication channel.",
      ],
      commonMistakes: [
        "Chasing a vendor before checking whether the invoice number was normalized differently.",
        "Using a generic message when the supplier needs exact invoice, date, and amount context.",
      ],
      reviewChecklist: [
        "Confirm invoice number, date, GSTIN, and tax amount against books.",
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
      "/gstr1-gstr3b-liability-mismatch-pre-checker",
    ],
    axalUpgradePath:
      "Use Axal for saved mappings, recurring reconciliation, IMS tracking, supplier tasks, and review workflow.",
    seoDepth: {
      inputGuide: [
        "Paste purchase-register and GSTR-2B rows together with a source column set to purchase or 2b.",
        "Include supplier or GSTIN, invoice, and taxAmount. Add invoiceDate and document type when available for manual review.",
      ],
      exampleWorkflow: [
        "Paste a small reconciliation slice from books and GSTR-2B.",
        "Review missing, extra, mismatch, duplicate, and matched buckets.",
        "Use the exception list as a working basis for supplier follow-up or deeper Axal reconciliation.",
      ],
      commonMistakes: [
        "Comparing only invoice numbers when supplier GSTIN or invoice date differs.",
        "Treating a matched tax amount as a final credit decision without reviewing document type and portal state.",
      ],
      reviewChecklist: [
        "Check duplicate keys before acting on missing or extra buckets.",
        "Review amount differences against tax components and invoice amendments.",
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
            "No. IMS-linked review needs saved context and professional workflow; use the output only as an exception draft.",
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
    relatedSlugs: [
      "/msme-45-day-payment-due-date-calculator",
      "/privacy/review-copy-builder",
      "/income-tax-act-2025-tds-section-translator",
    ],
    axalUpgradePath:
      "Manage client evidence, review tasks, document vault, and tax-fact history in Axal.",
    seoDepth: {
      inputGuide: [
        "Use one row per AIS/Form 26AS mismatch with source, category, amount, recordsAmount, and note.",
        "Add TAN, section, and feedbackAction when available so the draft points to the next review step.",
      ],
      exampleWorkflow: [
        "Paste a small mismatch list from AIS, Form 26AS, or a working sheet.",
        "Review amount differences and classify what needs deductor or portal follow-up.",
        "Download the draft and verify against the taxpayer records before filing review.",
      ],
      commonMistakes: [
        "Mixing AIS and Form 26AS rows without marking the source.",
        "Sending a correction request before checking section, TAN, and income category.",
      ],
      reviewChecklist: [
        "Check source, TAN, section, amount, and recordsAmount for every row.",
        "Separate missing-in-books cases from amount differences.",
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
    relatedSlugs: [
      "/privacy/review-copy-builder",
      "/gstr-2b-missing-invoice-vendor-follow-up",
    ],
    axalUpgradePath:
      "Attach evidence to obligations, matters, document vault, and task follow-up in Axal.",
    seoDepth: {
      inputGuide: [
        "Use one row per attempt with attemptedAt, action, and error.",
        "Add timezone, retryCount, and complaintReference when available.",
      ],
      exampleWorkflow: [
        "Record each portal attempt close to the time it happened.",
        "Paste the attempt timeline and review the user-observed memo.",
        "Attach screenshots or complaint references in your controlled evidence file or Axal matter.",
      ],
      commonMistakes: [
        "Writing a broad outage claim when only a user-observed attempt was recorded.",
        "Leaving out timezone, browser context, or complaint reference from the working note.",
      ],
      reviewChecklist: [
        "Confirm timestamps and timezone before sharing the memo.",
        "Separate user errors, browser issues, and portal errors where possible.",
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
    ],
    outputArtifacts: ["masked text draft", "review footer"],
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
        "Check the masked text and the detector counts.",
        "Remove or rewrite any remaining personal or client context before sharing.",
      ],
      commonMistakes: [
        "Assuming pattern masking catches names, addresses, PDFs, screenshots, or scanned text.",
        "Sharing the draft before checking whether the placeholders changed the meaning.",
      ],
      reviewChecklist: [
        "Check PAN, TAN, GSTIN, Aadhaar-like, bank, email, phone, and UPI placeholders.",
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
  {
    slug: "/gstr1-gstr3b-liability-mismatch-pre-checker",
    h1: "GSTR-1 vs GSTR-3B Liability Mismatch Pre-Checker",
    seoTitle: "GSTR-1 vs GSTR-3B Liability Mismatch Pre-Checker | Rule 88C",
    metaDescription:
      "Compare GSTR-1 and GSTR-3B liability period by period and flag gaps that may draw a Rule 88C / DRC-01B intimation before you file.",
    title: "GSTR-1 vs GSTR-3B Liability Mismatch Pre-Checker",
    status: "mvp",
    audiences: ["CAs", "GST teams", "accountants", "finance controllers"],
    privacyMode: "browser-only",
    accountRequired: false,
    fileUploadRequired: false,
    telemetry: "none",
    supportedInputs: [
      "pasted period-wise GSTR-1 and GSTR-3B liability rows",
      "manual liability comparison table",
    ],
    unsupportedCases: [
      "Does not know or apply GSTN's actual Rule 88C trigger threshold; the exact Rs amount and percentage are not published and are described in the rule only as an amount and percentage the GST Council may recommend.",
      "Does not fetch live GSTR-1 or GSTR-3B data or confirm the portal's own DRC-01B status.",
      "Does not compute interest, penalty, or a DRC-03 payment amount.",
      "Does not replace checking the GST portal's own Return Compliance and Liability Mismatch screen.",
    ],
    outputArtifacts: ["plain-text period-wise liability gap review", "review checklist text"],
    officialSources: [cgstRule88c, cgstRule59, drc01bFaq],
    relatedSlugs: [
      "/gstr-2b-purchase-reconciliation-triage",
      "/gstr3b-outward-liability-prelock-gap-checker",
    ],
    axalUpgradePath:
      "Track recurring GSTR-1/GSTR-3B liability checks, DRC-01B replies, and filing review history in Axal.",
    seoDepth: {
      inputGuide: [
        "Use one row per GSTIN and tax period with gstr1Liability and gstr3bLiability as numbers.",
        "For QRMP filers, compare the quarter's cumulative GSTR-3B/3BQ liability against the quarter's GSTR-1/IFF liability, not a single month in isolation.",
      ],
      exampleWorkflow: [
        "Paste period-wise GSTR-1 and GSTR-3B liability figures before filing.",
        "Review any period flagged review-needed, since GSTR-1 liability exceeds GSTR-3B liability there.",
        "Cross-check flagged periods against the GST portal's own Liability Mismatch screen before expecting a DRC-01B intimation.",
      ],
      commonMistakes: [
        "Assuming a specific Rs or percentage figure is the DRC-01B trigger point when GSTN has not published one.",
        "Comparing a running annual total instead of the correct per-period, or per-quarter for QRMP, figures.",
      ],
      reviewChecklist: [
        "Confirm both liability figures are for the same tax period and the same GSTIN.",
        "Check whether the period is monthly or QRMP quarterly before comparing.",
        "If a real DRC-01B intimation is received, note the seven-day reply window and reply through DRC-03 or the portal's Part B explanation before the next period's GSTR-1/IFF is blocked.",
      ],
      sourceExplainer:
        "CGST Rules 88C and 59, and the official DRC-01B FAQ, are used to frame the comparison direction, reply window, and non-response consequence; GSTN does not publish the exact numeric threshold, so this tool does not claim to know it.",
      faqItems: [
        {
          question: "What exact gap triggers a DRC-01B notice?",
          answer:
            "GSTN has not published the exact Rs amount or percentage. Rule 88C only says the GST Council may recommend an amount and percentage; treat any period where GSTR-1 liability exceeds GSTR-3B liability as worth reviewing.",
        },
        {
          question: "Does this tool submit anything to the GST portal?",
          answer:
            "No. It only compares pasted figures in your browser and produces a review draft.",
        },
      ],
    },
    trustCopy: STANDARD_TRUST_COPY,
    bannedClaims: BANNED_PUBLIC_CLAIMS,
  },
  {
    slug: "/gstr3b-outward-liability-prelock-gap-checker",
    h1: "GSTR-3B Outward Liability Pre-Lock Gap Checker",
    seoTitle: "GSTR-3B Table 3.1/3.2 Pre-Lock Gap Checker",
    metaDescription:
      "Compare books or GSTR-1 figures against the auto-populated, non-editable GSTR-3B outward-liability tables and see which correction path is still open.",
    title: "GSTR-3B Outward Liability Pre-Lock Gap Checker",
    status: "mvp",
    audiences: ["CAs", "GST teams", "accountants", "finance controllers"],
    privacyMode: "browser-only",
    accountRequired: false,
    fileUploadRequired: false,
    telemetry: "none",
    supportedInputs: [
      "pasted books/GSTR-1 line items with an auto-populated comparison value",
      "manual liability comparison table",
    ],
    unsupportedCases: [
      "Does not track or assume a Table 4 (ITC) hard-lock date; no official GSTN advisory confirming an ITC lock date has been found, so this tool does not use that as a claim.",
      "Does not know the confirmed effective tax period for the Table 3.2 lock with certainty; GSTN advisories point to both July 2025 and a later November 2025 date, and this tool surfaces both rather than picking one.",
      "Does not file GSTR-1A or amend any return on your behalf.",
      "Does not compute interest, penalty, or a filing-position number.",
    ],
    outputArtifacts: ["plain-text line-by-line gap review", "correction-path checklist"],
    officialSources: [gstr3bTable31Advisory, gstr3bTable32Advisory, gstr1aFaq],
    relatedSlugs: [
      "/gstr1-gstr3b-liability-mismatch-pre-checker",
      "/gstr-2b-purchase-reconciliation-triage",
    ],
    axalUpgradePath:
      "Track recurring pre-lock reviews, GSTR-1A windows, and amendment follow-up across periods in Axal.",
    seoDepth: {
      inputGuide: [
        "Use one row per line item with booksValue and autoPopulatedValue as numbers, and a table column set to 3.1 or 3.2.",
        "Mark whether GSTR-3B for the period has already been filed, since that changes the correction path.",
      ],
      exampleWorkflow: [
        "Paste books/GSTR-1 figures next to the GSTR-3B auto-populated figures before filing.",
        "Review rows flagged needs-amendment and check the suggested correction path.",
        "If GSTR-3B is not yet filed, use GSTR-1A for this period; if it is already filed, plan the correction into a later period's GSTR-1.",
      ],
      commonMistakes: [
        "Assuming GSTR-1A can fix a period after that period's GSTR-3B has already been filed; it cannot.",
        "Treating the Table 3.2 lock date as settled when GSTN's own advisories show two different dates.",
      ],
      reviewChecklist: [
        "Confirm which table, 3.1 or 3.2, each row belongs to.",
        "Confirm whether GSTR-3B for the period is already filed before choosing a correction path.",
        "Re-check the GST portal's advisory page for the current Table 3.2 effective date before relying on this tool's hedge.",
      ],
      sourceExplainer:
        "GSTN advisories on Table 3.1 and Table 3.2 non-editability, and the official GSTR-1A FAQ, are used to frame the lock status and correction window; where GSTN's own advisories disagree on a date, this tool discloses both rather than guessing.",
      faqItems: [
        {
          question: "Is GSTR-3B Table 4 (ITC) locked too?",
          answer:
            "Not as far as any official GSTN advisory shows. Tax press has discussed a possible future ITC lock, but this tool does not treat that as confirmed and does not use it to create urgency.",
        },
        {
          question: "Can I use GSTR-1A to fix an already-filed period?",
          answer:
            "No. GSTR-1A only works for the current period before that period's GSTR-3B is filed. A correction after filing needs to go through a later period's GSTR-1.",
        },
      ],
    },
    trustCopy: STANDARD_TRUST_COPY,
    bannedClaims: BANNED_PUBLIC_CLAIMS,
  },
  {
    slug: "/income-tax-act-2025-tds-section-translator",
    h1: "Income-tax Act 2025 TDS Section Translator",
    seoTitle: "Income-tax Act 2025 TDS Section Translator",
    metaDescription:
      "Translate old Income-tax Act 1961 TDS section numbers into their Income-tax Act 2025 citation, with independently verified rows only.",
    title: "Income-tax Act 2025 TDS Section Translator",
    status: "mvp",
    audiences: ["CAs", "TDS teams", "accountants", "payroll teams"],
    privacyMode: "browser-only",
    accountRequired: false,
    fileUploadRequired: false,
    telemetry: "none",
    supportedInputs: ["pasted list of old Income-tax Act, 1961 section numbers"],
    unsupportedCases: [
      "Only covers a limited, independently verified set of old sections (currently 192, 193, 194, 194A, 194C, 194H, 194-I, 194-IA, 194J, and 195); any other section is marked not verified rather than guessed.",
      "Does not compute the exact TDS amount for a specific payment; use the cited rate and threshold as a starting point only.",
      "Does not track further CBDT notifications or clarifications issued after the last-reviewed date shown for each source.",
      "Does not resolve payments that could fall under more than one nature-of-payment category.",
    ],
    outputArtifacts: ["plain-text section translation table", "review checklist text"],
    officialSources: [incomeTaxAct2025Gazette, tdsComplianceHelp],
    relatedSlugs: [
      "/ais-form-26as-mismatch-checker",
      "/schedule-112a-capital-gains-csv-builder",
    ],
    axalUpgradePath:
      "Track TDS deductions, section citations, and filing review history across periods in Axal.",
    seoDepth: {
      inputGuide: [
        "Paste one old section number per row, such as 194C or 194J.",
        "Section numbers can include or omit the word Section; both formats are matched.",
      ],
      exampleWorkflow: [
        "Paste the old section numbers used in your payroll or accounts-payable TDS setup.",
        "Review the matched new-Act citation, or the not-verified flag if a section is not yet in the confirmed set.",
        "For any not-verified section, check the gazetted Income-tax Act, 2025 text or the government's own comparison utility before filing.",
      ],
      commonMistakes: [
        "Assuming every old section has a simple one-to-one new section number; the new Act often cites a Table and Serial Number inside Section 393, not a bare section number.",
        "Reusing an old section number on a Tax Year 2026-27 filing without checking whether it has been renumbered.",
      ],
      reviewChecklist: [
        "Confirm the payment date falls in Tax Year 2026-27 or later before applying an Income-tax Act 2025 citation.",
        "Use the full Table and Serial Number citation, not just Section 393, when documenting the deduction.",
        "For any not-verified section, check the gazetted Act text or the official comparison utility directly.",
      ],
      sourceExplainer:
        "The gazetted Income-tax Act, 2025 text and the Income Tax Department's own TDS Compliance page are used to confirm each mapping row directly against the statute; rows without that direct confirmation are marked not verified instead of estimated.",
      faqItems: [
        {
          question: "Why are only some old sections covered?",
          answer:
            "Each row in this tool was matched directly against the gazetted Income-tax Act, 2025 text. Sections that could not be independently confirmed this way are marked not verified rather than guessed.",
        },
        {
          question: "Does the new Act still use section numbers like 194C?",
          answer:
            "No. TDS on most payments other than salary is now under Section 393, referenced by a Table and Serial Number, such as Section 393(1) Table Sl. No. 6(i) for the old 194C.",
        },
      ],
    },
    trustCopy: STANDARD_TRUST_COPY,
    bannedClaims: BANNED_PUBLIC_CLAIMS,
  },
  {
    slug: "/schedule-112a-capital-gains-csv-builder",
    h1: "Schedule 112A Capital Gains CSV Builder",
    seoTitle: "Schedule 112A Scrip-Wise Capital Gains CSV Builder",
    metaDescription:
      "Turn pasted scrip-wise sale rows into a Schedule 112A field structure, with Section 55(2)(ac) grandfathering and the July 2024 rate-period split.",
    title: "Schedule 112A Capital Gains CSV Builder",
    status: "mvp",
    audiences: ["CAs", "tax preparers", "taxpayers with listed equity gains"],
    privacyMode: "browser-only",
    accountRequired: false,
    fileUploadRequired: false,
    telemetry: "none",
    supportedInputs: [
      "pasted scrip-wise sale rows with ISIN, quantity, sale price, and cost of acquisition",
      "optional 31-Jan-2018 FMV per scrip for grandfathering",
    ],
    unsupportedCases: [
      "Does not download or confirm the live e-filing portal bulk-upload template; the department's own published instructions PDF and its AY 2025-26 validation rules disagree on the exact column set, so headers must be re-checked against the current portal template before upload.",
      "Does not maintain or supply 31-Jan-2018 FMV figures; you must enter your own per scrip.",
      "Does not cover unlisted shares or Schedule 115AD foreign-portfolio-investor rows.",
      "Does not compute final tax payable, surcharge, or cess.",
    ],
    outputArtifacts: [
      "plain-text scrip-wise capital gains table",
      "CSV-style field export for reuse",
      "grandfathering review checklist",
    ],
    officialSources: [schedule112aCsvInstructions, itr2ValidationRulesAy2025, financeAct2024Gazette],
    relatedSlugs: [
      "/ais-form-26as-mismatch-checker",
      "/income-tax-act-2025-tds-section-translator",
    ],
    axalUpgradePath:
      "Track capital-gains working papers, broker statement history, and filing review across assessment years in Axal.",
    seoDepth: {
      inputGuide: [
        "Use one row per scrip sale with isin, quantity, salePricePerUnit, saleDate, and costOfAcquisitionActual.",
        "Add fmv31Jan2018PerUnit only if you want Section 55(2)(ac) grandfathering applied; leave it blank otherwise.",
      ],
      exampleWorkflow: [
        "Paste scrip-wise rows from your broker capital-gains statement.",
        "Review the before/on-or-after 23 July 2024 classification and the grandfathered cost of acquisition for each row.",
        "Re-download the current Schedule 112A bulk-upload template from the ITR utility and align headers before uploading.",
      ],
      commonMistakes: [
        "Uploading this tool's export directly without checking it against the live portal template, which has changed column requirements before.",
        "Leaving out the 31-Jan-2018 FMV and then treating the resulting cost of acquisition as grandfathered when it is not.",
      ],
      reviewChecklist: [
        "Confirm the ISIN is a 12-character alphanumeric code.",
        "Confirm the before/on-or-after 23 July 2024 classification matches the actual transfer date.",
        "Re-verify the live bulk-upload template's column order before uploading anything to the portal.",
        "Remember the Section 112A LTCG exemption threshold is Rs 1,25,000 applied on an aggregate basis across both rate periods, not per period; this tool does not apply that exemption for you.",
      ],
      sourceExplainer:
        "The department's Schedule 112A CSV instructions and the gazetted Finance (No. 2) Act, 2024 are used for the field structure, the Section 55(2)(ac) grandfathering formula, and the 23 July 2024 rate cutover; the live portal template itself must still be re-checked each filing season.",
      faqItems: [
        {
          question: "Is the exported table ready to upload as-is?",
          answer:
            "No. Re-download the current bulk-upload template from the ITR-2/ITR-3 utility and confirm the column headers and order match before uploading; the department's own instructions PDF is known to lag its live validation rules.",
        },
        {
          question: "What happens if I do not enter a 31-Jan-2018 FMV?",
          answer:
            "The tool uses your actual cost of acquisition without grandfathering and flags the row so you know grandfathering was not applied.",
        },
      ],
    },
    trustCopy: STANDARD_TRUST_COPY,
    bannedClaims: BANNED_PUBLIC_CLAIMS,
  },
  {
    slug: "/labour-code-gratuity-wage-recalculator",
    h1: "Labour Code Gratuity and Wage Recalculator",
    seoTitle: "Labour Code 50% Wage Rule Gratuity Recalculator",
    metaDescription:
      "Apply the Code on Wages 50% wage-component test and compare gratuity under the old wage structure against the Code on Social Security calculation.",
    title: "Labour Code Gratuity and Wage Recalculator",
    status: "mvp",
    audiences: ["payroll teams", "HR compliance officers", "CAs"],
    privacyMode: "browser-only",
    accountRequired: false,
    fileUploadRequired: false,
    telemetry: "none",
    supportedInputs: [
      "pasted employee rows with basic, DA, other remuneration components, employment type, years of service, and optional termination reason",
    ],
    unsupportedCases: [
      "Does not compute leave encashment or PF contribution amounts; it only shows the recalculated wage base those figures would use.",
      "Does not apply state-specific Labour Code rules, which were still rolling out unevenly as of the last-reviewed date.",
      "Does not model the exact fixed-term pro-rata gratuity formula; it applies the standard formula and flags fixed-term rows for manual confirmation.",
      "Does not confirm whether the Payment of Gratuity Act, as now subsumed into the Code on Social Security, applies to a given establishment.",
      "Death and disablement exceptions are applied only when terminationReason is explicitly entered; otherwise under-5 permanent rows are sent to manual review.",
    ],
    outputArtifacts: ["plain-text wage-test and gratuity comparison table", "review checklist text"],
    officialSources: [codeOnWages, codeOnSocialSecurity, labourCodeFaqMarch2026],
    relatedSlugs: [
      "/msme-45-day-payment-due-date-calculator",
      "/ais-form-26as-mismatch-checker",
    ],
    axalUpgradePath:
      "Track recurring payroll wage-structure reviews and gratuity provisioning history across employees in Axal.",
    seoDepth: {
      inputGuide: [
        "Use one row per employee with basic, da, otherComponents (all other monthly pay components besides basic/DA/retaining allowance), employmentType, yearsOfService, and optional terminationReason.",
        "Set employmentType to permanent or fixed-term; fixed-term employees use a 1-year eligibility threshold instead of 5 years. For permanent employees below 5 years, enter terminationReason only when death or disablement needs to be reviewed.",
      ],
      exampleWorkflow: [
        "Paste employee pay-component rows.",
        "Review which rows exceed the 50% wage-component test and see the resulting effective wage base.",
        "Compare the old and new gratuity figures for eligible employees before updating provisioning.",
      ],
      commonMistakes: [
        "Applying the 50% add-back to gratuity or retrenchment compensation; only components (a) through (i) of Section 2(y) are tested, not gratuity or retrenchment pay.",
        "Treating the currently notified Rs 20 lakh gratuity cap as a fixed number in the Act text; it is a notified amount that can change by future notification.",
      ],
      reviewChecklist: [
        "Confirm which pay components were included in otherComponents for each employee.",
        "Confirm gratuity eligibility (5 years for permanent employees, death/disablement exceptions, and 1 year for fixed-term per Ministry FAQ guidance) before relying on a computed figure.",
        "Re-check state-specific Labour Code rules for your establishment before finalizing any provisioning figure.",
      ],
      sourceExplainer:
        "The Code on Wages 2019 wage definition, the Code on Social Security 2020 gratuity section, and Ministry of Labour FAQs are used together; figures sourced only from the FAQs, such as the fixed-term 1-year threshold, are labeled as FAQ guidance rather than statute text.",
      faqItems: [
        {
          question: "Is the Rs 20 lakh gratuity cap fixed in the law?",
          answer:
            "No. The Code on Social Security, 2020 caps gratuity at an amount the Central Government notifies from time to time; Rs 20 lakh is the amount currently notified, not a number written into the Act itself.",
        },
        {
          question: "Where does the 1-year fixed-term threshold come from?",
          answer:
            "It comes from a Ministry of Labour and Employment FAQ, not directly from the Act text. The Ministry's own FAQs state the Code prevails if there is any difference, so treat this as guidance to confirm, not final law.",
        },
      ],
    },
    trustCopy: STANDARD_TRUST_COPY,
    bannedClaims: BANNED_PUBLIC_CLAIMS,
  },
  {
    slug: "/maharera-form-3-withdrawal-worksheet",
    h1: "MahaRERA Form 3 Withdrawal Worksheet",
    seoTitle: "MahaRERA Form 3 Withdrawal Worksheet",
    metaDescription:
      "Work through the MahaRERA Form 3 designated-account withdrawal ceiling using the documented cost-incurred proportion formula.",
    title: "MahaRERA Form 3 Withdrawal Worksheet",
    status: "mvp",
    audiences: ["CAs", "RERA compliance consultants", "developers"],
    privacyMode: "browser-only",
    accountRequired: false,
    fileUploadRequired: false,
    telemetry: "none",
    supportedInputs: [
      "pasted project rows with estimated and incurred land/construction cost, prior withdrawals, and account balance",
    ],
    unsupportedCases: [
      "Scoped to Maharashtra only; other states use different RERA forms and, in at least one documented case, a different withdrawal formula.",
      "Does not compute the separate 70%-versus-100% deposit threshold from Form 3 Table D; it flags that check as a manual step.",
      "Does not certify or replace the engineer, architect, or chartered accountant certification Form 3 itself requires.",
      "Does not confirm whether financing or interest cost should be included in cost incurred; that inclusion is not settled in the source used and is flagged when entered.",
    ],
    outputArtifacts: ["plain-text withdrawal ceiling worksheet", "review checklist text"],
    officialSources: [mahareraForm3],
    relatedSlugs: [
      "/msme-45-day-payment-due-date-calculator",
      "/gst-portal-issue-evidence-memo",
    ],
    axalUpgradePath:
      "Track recurring RERA withdrawal certifications, bank account rollforwards, and audit history per project in Axal.",
    seoDepth: {
      inputGuide: [
        "Use one row per project or withdrawal request with totalEstimatedLandCost, totalEstimatedConstructionCost, landCostIncurred, constructionCostIncurred, and amountWithdrawnTillDate.",
        "Add designatedAccountBalance if you want the computed ceiling capped by the actual funds available in the account.",
      ],
      exampleWorkflow: [
        "Paste project cost figures for the current withdrawal request.",
        "Review the computed proportion of cost incurred and the resulting withdrawal ceiling.",
        "Check the Table D 70%-versus-100% deposit threshold and the tripartite certification separately before finalizing Form 3.",
      ],
      commonMistakes: [
        "Assuming this worksheet applies outside Maharashtra; other states use different forms and formulas.",
        "Skipping the separate Table D deposit-threshold check because the withdrawal ceiling looked fine.",
      ],
      reviewChecklist: [
        "Confirm the project is registered with MahaRERA and this is the current Form 3 version.",
        "Confirm whether financing cost should be included in cost incurred for this engagement before adding it.",
        "Complete the engineer, architect, and CA tripartite certification required by Form 3 before withdrawal.",
      ],
      sourceExplainer:
        "The official MahaRERA Form 3 template is used for the worksheet structure and the documented cost-incurred proportion formula; this tool does not use a dual-reading ambiguity because that specific ambiguity was traced to a different state's form, not MahaRERA's.",
      faqItems: [
        {
          question: "Does this tool work for RERA states other than Maharashtra?",
          answer:
            "No. Other states, such as Uttar Pradesh and Haryana, use different forms and defined terms, and at least one other state's form has a documented formula ambiguity that MahaRERA's Form 3 does not share.",
        },
        {
          question: "Does the withdrawal ceiling formula have more than one valid reading?",
          answer:
            "Not for MahaRERA. The documented formula is the total estimated project cost multiplied by the proportion of cost incurred, per MahaRERA Circular No. 7/2017.",
        },
      ],
    },
    trustCopy: STANDARD_TRUST_COPY,
    bannedClaims: BANNED_PUBLIC_CLAIMS,
  },
];
