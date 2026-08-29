import { describe, it, expect } from "vitest";
import {
  computeFinancialBreakdown,
  generateEmiSchedule,
  InvalidMarginCapitalError,
  MICRO_FINANCE_MAX_PROJECT_COST,
  TERM_LOAN_MAX_PROJECT_COST
} from "../src/services/financial.service.js";

describe("computeFinancialBreakdown", () => {
  it("computes project cost and loan amount from margin capital (10% / 90% split)", () => {
    const result = computeFinancialBreakdown(100000);
    expect(result.projectCost).toBe(1000000);
    expect(result.loanAmount).toBe(900000);
  });

  it("selects Micro Finance Scheme when project cost is at or below ₹1.40 lakh", () => {
    // ₹14,000 margin -> ₹1,40,000 project cost -> exactly the boundary
    const result = computeFinancialBreakdown(14000);
    expect(result.projectCost).toBe(MICRO_FINANCE_MAX_PROJECT_COST);
    expect(result.scheme.slab).toBe("MICRO_FINANCE");
    expect(result.scheme.interestRatePct).toBe(6.5);
    expect(result.scheme.tenureMonths).toBe(36);
    expect(result.scheme.moratoriumMonths).toBe(3);
  });

  it("selects Term Loan Scheme just above the ₹1.40 lakh boundary", () => {
    // ₹14,001 margin -> ₹1,40,010 project cost -> just over the Micro Finance ceiling
    const result = computeFinancialBreakdown(14001);
    expect(result.projectCost).toBeGreaterThan(MICRO_FINANCE_MAX_PROJECT_COST);
    expect(result.scheme.slab).toBe("TERM_LOAN");
    expect(result.scheme.interestRatePct).toBe(8.0);
    expect(result.scheme.tenureMonths).toBe(84);
    expect(result.scheme.moratoriumMonths).toBe(6);
  });

  it("selects Term Loan Scheme at the ₹50 lakh maximum", () => {
    // ₹5,00,000 margin -> ₹50,00,000 project cost -> exactly the boundary
    const result = computeFinancialBreakdown(500000);
    expect(result.projectCost).toBe(TERM_LOAN_MAX_PROJECT_COST);
    expect(result.scheme.slab).toBe("TERM_LOAN");
  });

  it("flags OUT_OF_RANGE just above the ₹50 lakh maximum", () => {
    const result = computeFinancialBreakdown(500001);
    expect(result.scheme.slab).toBe("OUT_OF_RANGE");
  });

  it("handles a small minimum capital input correctly", () => {
    const result = computeFinancialBreakdown(5000);
    expect(result.projectCost).toBe(50000);
    expect(result.scheme.slab).toBe("MICRO_FINANCE");
  });

  it("rejects zero margin capital", () => {
    expect(() => computeFinancialBreakdown(0)).toThrow(InvalidMarginCapitalError);
  });

  it("rejects negative margin capital", () => {
    expect(() => computeFinancialBreakdown(-5000)).toThrow(InvalidMarginCapitalError);
  });

  it("rejects non-numeric margin capital", () => {
    expect(() => computeFinancialBreakdown("not-a-number")).toThrow(InvalidMarginCapitalError);
    expect(() => computeFinancialBreakdown(undefined)).toThrow(InvalidMarginCapitalError);
    expect(() => computeFinancialBreakdown(null)).toThrow(InvalidMarginCapitalError);
    expect(() => computeFinancialBreakdown({})).toThrow(InvalidMarginCapitalError);
  });

  it("accepts numeric strings (form inputs arrive as strings)", () => {
    const result = computeFinancialBreakdown("14000");
    expect(result.projectCost).toBe(140000);
  });
});

describe("generateEmiSchedule", () => {
  it("returns an empty schedule for OUT_OF_RANGE scheme", () => {
    const schedule = generateEmiSchedule(1000000, {
      slab: "OUT_OF_RANGE",
      name: "No matching scheme",
      interestRatePct: 0,
      tenureMonths: 0,
      moratoriumMonths: 0
    });
    expect(schedule).toEqual([]);
  });

  it("generates the correct number of repayment quarters for Micro Finance (12 total - 1 moratorium = 11)", () => {
    const { scheme, loanAmount } = computeFinancialBreakdown(14000);
    const schedule = generateEmiSchedule(loanAmount, scheme);
    expect(schedule).toHaveLength(11);
    expect(schedule[0].quarter).toBe(2); // starts after 1 moratorium quarter
  });

  it("generates the correct number of repayment quarters for Term Loan (28 total - 2 moratorium = 26)", () => {
    const { scheme, loanAmount } = computeFinancialBreakdown(100000);
    const schedule = generateEmiSchedule(loanAmount, scheme);
    expect(schedule).toHaveLength(26);
  });

  it("fully amortizes the loan — final closing balance is zero", () => {
    const { scheme, loanAmount } = computeFinancialBreakdown(100000);
    const schedule = generateEmiSchedule(loanAmount, scheme);
    const last = schedule[schedule.length - 1];
    expect(last.closingBalance).toBe(0);
  });

  it("each row's closing balance carries into the next row's opening balance", () => {
    const { scheme, loanAmount } = computeFinancialBreakdown(100000);
    const schedule = generateEmiSchedule(loanAmount, scheme);
    for (let i = 1; i < schedule.length; i++) {
      expect(schedule[i].openingBalance).toBe(schedule[i - 1].closingBalance);
    }
  });
});
