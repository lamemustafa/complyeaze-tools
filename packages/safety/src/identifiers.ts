export type IdentifierMaskCounts = {
  gstin: number;
  pan: number;
  tan: number;
  aadhaar: number;
  cin: number;
  udyam: number;
  dinDpin: number;
  llpin: number;
  email: number;
  phone: number;
  ifsc: number;
  upi: number;
  bankAccount: number;
};

export type IdentifierMaskCheckStatus = "found-and-masked" | "checked-not-found";

export type IdentifierMaskCheckedEntry = {
  key: keyof IdentifierMaskCounts;
  count: number;
  status: IdentifierMaskCheckStatus;
};

export type IdentifierMaskReport = {
  text: string;
  counts: IdentifierMaskCounts;
  checked: IdentifierMaskCheckedEntry[];
  notChecked: string[];
  manualReviewChecklist: string[];
  warning: string;
};

type Detector = {
  key: keyof IdentifierMaskCounts;
  pattern: RegExp;
  replacement: string | ((match: string, ...args: string[]) => string);
};

const detectors: Detector[] = [
  {
    key: "gstin",
    pattern: /\b[0-9]{2}[ \t-]?[A-Z](?:[ \t-]?[A-Z]){4}[ \t-]?[0-9](?:[ \t-]?[0-9]){3}[ \t-]?[A-Z][ \t-]?[1-9A-Z][ \t-]?Z[ \t-]?[0-9A-Z]\b/gi,
    replacement: "[GSTIN masked]",
  },
  {
    key: "pan",
    pattern: /\b[A-Z](?:[ \t-]?[A-Z]){4}[ \t-]?[0-9](?:[ \t-]?[0-9]){3}[ \t-]?[A-Z]\b/gi,
    replacement: "[PAN masked]",
  },
  {
    key: "tan",
    pattern: /\b[A-Z](?:[ \t-]?[A-Z]){3}[ \t-]?[0-9](?:[ \t-]?[0-9]){4}[ \t-]?[A-Z]\b/gi,
    replacement: "[TAN masked]",
  },
  {
    key: "cin",
    pattern: /\b[UL][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}\b/gi,
    replacement: "[CIN masked]",
  },
  {
    key: "udyam",
    pattern: /\bUDYAM[ \t-]?[A-Z]{2}[ \t-]?[0-9]{2}[ \t-]?[0-9]{7}\b/gi,
    replacement: "[Udyam registration masked]",
  },
  {
    key: "dinDpin",
    pattern: /\b((?:DIN|DPIN)\s*(?:no\.?|number)?\s*[:#-]?\s*)[0-9]{8}\b/gi,
    replacement: (_match, prefix: string) =>
      `${prefix.trimEnd()} [DIN/DPIN-like number masked]`,
  },
  {
    key: "llpin",
    pattern: /\b((?:LLPIN|LLP\s*IN)\s*(?:no\.?|number)?\s*[:#-]?\s*)[A-Z]{3}-?[0-9]{4}\b/gi,
    replacement: (_match, prefix: string) =>
      `${prefix.trimEnd()} [LLPIN-like identifier masked]`,
  },
  {
    key: "email",
    pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    replacement: "[email masked]",
  },
  {
    key: "ifsc",
    pattern: /\b[A-Z]{4}0[A-Z0-9]{6}\b/gi,
    replacement: "[IFSC masked]",
  },
  {
    key: "upi",
    pattern: /\b[A-Z0-9._-]+@[A-Z][A-Z0-9.-]{2,}\b/gi,
    replacement: "[UPI ID masked]",
  },
  {
    key: "bankAccount",
    pattern: /\b((?:a\/c|acct\.?|account|bank account)\s*(?:no\.?|number|#)?\s*[:#-]?\s*)[0-9][0-9 -]{8,20}[0-9]\b/gi,
    replacement: (_match, prefix: string) =>
      `${prefix.trimEnd()} [bank-account-like number masked]`,
  },
  {
    key: "phone",
    pattern: /(^|[^0-9])((?:\+91[ \t-]?)?(?:\(?[6-9][0-9]{4}\)?[ \t-]?[0-9]{5}|[6-9][0-9]{4}[ \t-]?[0-9]{5}))\b/g,
    replacement: (_match, prefix: string) => `${prefix}[phone-like number masked]`,
  },
  {
    key: "aadhaar",
    pattern: /\b[0-9]{4}[\s-]?[0-9]{4}[\s-]?[0-9]{4}\b/g,
    replacement: "[Aadhaar-like number masked]",
  },
];

const notCheckedAutomatically = [
  "names",
  "addresses",
  "partial or non-standard identifiers",
  "file names",
  "client references",
  "PDFs",
  "screenshots",
  "scanned text",
  "free-form client context",
];

const manualReviewChecklist = [
  "Re-read names, addresses, and free-form client context.",
  "Check whether screenshots, PDFs, scanned text, or attachments were reviewed outside this text box.",
  "Confirm masked placeholders did not change the meaning of the review note.",
  "Share only the smallest excerpt needed for professional review.",
];

export function maskIndianIdentifiers(input: string): string {
  return maskIndianIdentifiersWithReport(input).text;
}

export function maskIndianIdentifiersWithReport(input: string): IdentifierMaskReport {
  const counts = emptyCounts();
  let text = input;

  for (const detector of detectors) {
    text = text.replace(detector.pattern, (...args) => {
      counts[detector.key] += 1;
      if (typeof detector.replacement === "function") {
        return detector.replacement(args[0], ...args.slice(1));
      }
      return detector.replacement;
    });
  }

  return {
    text,
    counts,
    checked: detectors.map((detector) => ({
      key: detector.key,
      count: counts[detector.key],
      status: counts[detector.key] > 0 ? "found-and-masked" : "checked-not-found",
    })),
    notChecked: notCheckedAutomatically,
    manualReviewChecklist,
    warning:
      "Not a redaction certificate: Review Copy Builder masks common text patterns only; this is not irreversible redaction and not an all-clear.",
  };
}

function emptyCounts(): IdentifierMaskCounts {
  return {
    gstin: 0,
    pan: 0,
    tan: 0,
    aadhaar: 0,
    cin: 0,
    udyam: 0,
    dinDpin: 0,
    llpin: 0,
    email: 0,
    phone: 0,
    ifsc: 0,
    upi: 0,
    bankAccount: 0,
  };
}
