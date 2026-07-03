export type ToolSourceType = "official" | "news" | "community" | "competitor";

export type ToolSource = {
  title: string;
  publisher: string;
  url: string;
  sourceType: ToolSourceType;
  jurisdiction: "IN";
  lastReviewedAt: string;
  staleAfterDays: number;
  usedFor: string[];
};

export type ToolStatus = "landing" | "mvp" | "beta" | "stable";

export type ToolMeta = {
  slug: string;
  h1: string;
  seoTitle: string;
  metaDescription: string;
  title: string;
  status: ToolStatus;
  audiences: string[];
  privacyMode: "browser-only";
  accountRequired: false;
  fileUploadRequired: false;
  telemetry: "none";
  supportedInputs: string[];
  unsupportedCases: string[];
  outputArtifacts: string[];
  officialSources: ToolSource[];
  demandSignals?: ToolSource[];
  relatedSlugs: string[];
  axalUpgradePath: string;
  trustCopy: string[];
  bannedClaims: string[];
};
