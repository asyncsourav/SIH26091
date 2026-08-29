export type Role = "ENTREPRENEUR" | "ADMIN" | "PARTNER";

export interface PublicUser {
  id: string;
  name: string;
  phone: string;
  role: Role;
  village: string;
  block: string;
  district: string;
}

export type SchemeSlab = "MICRO_FINANCE" | "TERM_LOAN" | "OUT_OF_RANGE";

export interface SchemeTerms {
  slab: SchemeSlab;
  name: string;
  interestRatePct: number;
  tenureMonths: number;
  moratoriumMonths: number;
}

export interface FinancialBreakdown {
  marginCapital: number;
  projectCost: number;
  loanAmount: number;
  scheme: SchemeTerms;
}

export interface EmiScheduleRow {
  quarter: number;
  openingBalance: number;
  installment: number;
  interestPaid: number;
  principalPaid: number;
  closingBalance: number;
}

export interface Application {
  id: string;
  userId: string;
  marginCapital: string;
  projectCost: string;
  loanAmount: string;
  businessCategory: string;
  status: string;
  schemeId: string | null;
  user?: { name: string; village: string; block: string; district: string; latitude: number | null; longitude: number | null };
  scheme?: {
    id: string;
    name: string;
    interestRate: string;
    tenureMonths: number;
    moratoriumMonths: number;
  } | null;
  createdAt: string;
}

export interface FeasibilityReport {
  id: string;
  applicationId: string;
  marketReach: {
    radiusKm: number;
    estimatedConsumerBase: number;
    primaryDistributionChannels: string[];
    summary: string;
  };
  opportunityAnalysis: { underservedNiches: string[]; summary: string };
  swot: { strengths: string[]; weaknesses: string[]; opportunities: string[]; threats: string[] };
  threats: { supplyChainRisks: string[]; seasonalRisks: string[]; buyerDependencyRisk: string };
  competitorDensity: { count: number; interpretation: string };
  pricingSuggestion: { strategy: string; suggestedRangeNote: string };
  rawSources: string[];
  isStaticFallback: boolean;
}

export interface CompetitorPin {
  id: number;
  name: string;
  lat: number;
  lon: number;
  tag: string;
}
