/**
 * Deterministic financial structuring engine.
 *
 * Zero AI involvement by design — every number here must be exactly
 * reproducible and auditable, because this is the part of the app a real
 * beneficiary's loan eligibility depends on. Scheme slabs and rates are
 * seeded from official NSFDC/NSKFDC published scheme data (see prisma/seed.ts),
 * never invented here.
 */

export const MARGIN_CONTRIBUTION_PCT = 0.10;
export const LOAN_PCT_OF_PROJECT_COST = 0.90;

export const MICRO_FINANCE_MAX_PROJECT_COST = 140_000; // ₹1.40 lakh
export const TERM_LOAN_MAX_PROJECT_COST = 5_000_000; // ₹50.00 lakh

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

export class InvalidMarginCapitalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidMarginCapitalError";
  }
}

const SCHEME_TERMS: Record<Exclude<SchemeSlab, "OUT_OF_RANGE">, Omit<SchemeTerms, "slab">> = {
  MICRO_FINANCE: {
    name: "Micro Finance Scheme",
    interestRatePct: 6.5,
    tenureMonths: 36,
    moratoriumMonths: 3
  },
  TERM_LOAN: {
    name: "Term Loan Scheme",
    interestRatePct: 8.0,
    tenureMonths: 84,
    moratoriumMonths: 6
  }
};

/** Rounds to the nearest paisa-safe 2 decimal places, avoiding float drift. */
function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function computeFinancialBreakdown(marginCapitalInput: unknown): FinancialBreakdown {
  const marginCapital = Number(marginCapitalInput);

  if (typeof marginCapitalInput !== "number" && typeof marginCapitalInput !== "string") {
    throw new InvalidMarginCapitalError("Margin capital must be a number.");
  }
  if (!Number.isFinite(marginCapital) || Number.isNaN(marginCapital)) {
    throw new InvalidMarginCapitalError("Margin capital must be a valid number.");
  }
  if (marginCapital <= 0) {
    throw new InvalidMarginCapitalError("Margin capital must be greater than zero.");
  }

  const projectCost = round2(marginCapital / MARGIN_CONTRIBUTION_PCT);
  const loanAmount = round2(projectCost * LOAN_PCT_OF_PROJECT_COST);

  let scheme: SchemeTerms;
  if (projectCost <= MICRO_FINANCE_MAX_PROJECT_COST) {
    scheme = { slab: "MICRO_FINANCE", ...SCHEME_TERMS.MICRO_FINANCE };
  } else if (projectCost <= TERM_LOAN_MAX_PROJECT_COST) {
    scheme = { slab: "TERM_LOAN", ...SCHEME_TERMS.TERM_LOAN };
  } else {
    scheme = {
      slab: "OUT_OF_RANGE",
      name: "No matching scheme",
      interestRatePct: 0,
      tenureMonths: 0,
      moratoriumMonths: 0
    };
  }

  return { marginCapital, projectCost, loanAmount, scheme };
}

export interface EmiScheduleRow {
  quarter: number;
  openingBalance: number;
  installment: number;
  interestPaid: number;
  principalPaid: number;
  closingBalance: number;
}

/**
 * Generates a quarterly reducing-balance repayment schedule. Repayment
 * quarters only begin after the moratorium period elapses; the moratorium
 * quarters themselves carry no installment (principal untouched, per the
 * scheme's "moratorium" definition — no repayment obligation during it).
 */
export function generateEmiSchedule(loanAmount: number, scheme: SchemeTerms): EmiScheduleRow[] {
  if (scheme.slab === "OUT_OF_RANGE") return [];

  const totalQuarters = Math.round(scheme.tenureMonths / 3);
  const moratoriumQuarters = Math.round(scheme.moratoriumMonths / 3);
  const repaymentQuarters = totalQuarters - moratoriumQuarters;
  const quarterlyRate = scheme.interestRatePct / 100 / 4;

  if (repaymentQuarters <= 0) return [];

  // Standard reducing-balance quarterly installment (annuity formula).
  const installment =
    quarterlyRate === 0
      ? loanAmount / repaymentQuarters
      : (loanAmount * quarterlyRate * Math.pow(1 + quarterlyRate, repaymentQuarters)) /
        (Math.pow(1 + quarterlyRate, repaymentQuarters) - 1);

  const schedule: EmiScheduleRow[] = [];
  let balance = loanAmount;

  for (let q = 1; q <= repaymentQuarters; q++) {
    const interestPaid = round2(balance * quarterlyRate);
    let principalPaid = round2(installment - interestPaid);
    // Final quarter: settle any rounding residue exactly to zero.
    if (q === repaymentQuarters) {
      principalPaid = round2(balance);
    }
    const closingBalance = round2(balance - principalPaid);

    schedule.push({
      quarter: moratoriumQuarters + q,
      openingBalance: round2(balance),
      installment: round2(principalPaid + interestPaid),
      interestPaid,
      principalPaid,
      closingBalance: Math.max(closingBalance, 0)
    });

    balance = closingBalance;
  }

  return schedule;
}
