export interface FeasibilityReportInput {
  village: string;
  block: string;
  district: string;
  businessCategory: string;
  marginCapital: number;
  projectCost: number;
  loanAmount: number;
  competitorCount: number;
  groundingChunks: { id: string; content: string }[];
}

export interface FeasibilityReport {
  marketReach: {
    radiusKm: number;
    estimatedConsumerBase: number;
    primaryDistributionChannels: string[];
    summary: string;
  };
  opportunityAnalysis: {
    underservedNiches: string[];
    summary: string;
  };
  swot: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  threats: {
    supplyChainRisks: string[];
    seasonalRisks: string[];
    buyerDependencyRisk: string;
  };
  competitorDensity: {
    count: number;
    interpretation: string;
  };
  pricingSuggestion: {
    strategy: string;
    suggestedRangeNote: string;
  };
}

/**
 * A single interface any LLM backend can implement. Keeping report
 * generation behind this interface means swapping Gemini for Claude, GPT, or
 * a self-hosted model later is a one-file change — nothing else in the
 * codebase depends on a specific provider's SDK.
 */
export interface AIProvider {
  generateFeasibilityReport(input: FeasibilityReportInput): Promise<{
    report: FeasibilityReport;
    sourceChunkIds: string[];
  }>;
  embedText(text: string): Promise<number[]>;
}
