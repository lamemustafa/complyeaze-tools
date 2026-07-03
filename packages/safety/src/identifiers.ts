export type IdentifierMaskCounts = {
  gstin: number;
  pan: number;
  tan: number;
  aadhaar: number;
  email: number;
  phone: number;
  ifsc: number;
  upi: number;
  bankAccount: number;
};

export type IdentifierMaskReport = {
  text: string;
  counts: IdentifierMaskCounts;
  notChecked: string[];
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
    pattern: /\b[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]\b/gi,
    replacement: "[GSTIN masked]",
  },
  {
    key: "pan",
    pattern: /\b[A-Z]{5}[0-9]{4}[A-Z]\b/gi,
    replacement: "[PAN masked]",
  },
  {
    key: "tan",
    pattern: /\b[A-Z]{4}[0-9]{5}[A-Z]\b/gi,
    replacement: "[TAN masked]",
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
    pattern: /\b((?:a\/c|account|bank account)\s*(?:no\.?|number)?\s*)[0-9][0-9 -]{8,20}[0-9]\b/gi,
    replacement: (_match, prefix: string) =>
      `${prefix.trimEnd()} [bank-account-like number masked]`,
  },
  {
    key: "aadhaar",
    pattern: /\b[0-9]{4}\s?[0-9]{4}\s?[0-9]{4}\b/g,
    replacement: "[Aadhaar-like number masked]",
  },
  {
    key: "phone",
    pattern: /\b(?:\+91[\s-]?)?[6-9][0-9]{4}[\s-]?[0-9]{5}\b/g,
    replacement: "[phone-like number masked]",
  },
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
    notChecked: [
      "names",
      "addresses",
      "PDFs",
      "screenshots",
      "scanned text",
      "free-form client context",
    ],
    warning:
      "Review Copy Builder masks common text patterns only; this is not irreversible redaction.",
  };
}

function emptyCounts(): IdentifierMaskCounts {
  return {
    gstin: 0,
    pan: 0,
    tan: 0,
    aadhaar: 0,
    email: 0,
    phone: 0,
    ifsc: 0,
    upi: 0,
    bankAccount: 0,
  };
}
