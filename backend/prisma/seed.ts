import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Gram Vyapaar database...");

  // ---------------------------------------------------------------------
  // 1. Schemes — real slab structure as published by NSFDC/NSKFDC and
  //    described in the PS 26091 problem statement. Do not change these
  //    numbers without updating the source documentation reference.
  // ---------------------------------------------------------------------
  const microFinance = await prisma.scheme.upsert({
    where: { id: "seed-micro-finance-scheme" },
    update: {},
    create: {
      id: "seed-micro-finance-scheme",
      name: "Micro Finance Scheme",
      minProjectCost: 0,
      maxProjectCost: 140000,
      maxLoanPct: 0.9,
      interestRate: 6.5,
      tenureMonths: 36,
      moratoriumMonths: 3,
      sourceDocUrl: "https://nsfdc.nic.in/en/scheme/micro-finance-scheme",
      active: true
    }
  });

  const termLoan = await prisma.scheme.upsert({
    where: { id: "seed-term-loan-scheme" },
    update: {},
    create: {
      id: "seed-term-loan-scheme",
      name: "Term Loan Scheme",
      minProjectCost: 140000.01,
      maxProjectCost: 5000000,
      maxLoanPct: 0.9,
      interestRate: 8.0,
      tenureMonths: 84,
      moratoriumMonths: 6,
      sourceDocUrl: "https://nsfdc.nic.in/en/scheme/term-loan-scheme",
      active: true
    }
  });

  // ---------------------------------------------------------------------
  // 2. SchemeDocChunk — plain-text excerpts summarizing the two schemes,
  //    used as RAG grounding context. No embedding vector is populated by
  //    this seed script (that requires a live Gemini API call); the
  //    embedding column stays NULL until a real report generation run
  //    backfills it, OR you run `npm run embed-chunks` (see README) once
  //    you have a GEMINI_API_KEY configured. rag.service.ts already
  //    filters on `embedding IS NOT NULL`, so this is safe to leave empty
  //    for local dev — the AI report simply generates without grounding
  //    until chunks are embedded.
  // ---------------------------------------------------------------------
  await prisma.schemeDocChunk.createMany({
    data: [
      {
        schemeId: microFinance.id,
        content:
          "Micro Finance Scheme: for micro enterprises with a total project cost up to Rs. 1,40,000. " +
          "The beneficiary contributes 10% as margin money and the funding agency provides up to 90% " +
          "(maximum Rs. 1,25,000) as a concessional loan at 6.5% per annum interest, repayable over 3 " +
          "years including an initial 3-month moratorium period during which no installment is due."
      },
      {
        schemeId: termLoan.id,
        content:
          "Term Loan Scheme: for larger projects with a total project cost between Rs. 1,40,000 and " +
          "Rs. 50,00,000. The beneficiary contributes 10% as margin money and the funding agency provides " +
          "up to 90% (maximum Rs. 45,00,000) as a concessional loan at 8% per annum interest, repayable " +
          "over 7 years including an initial 6-month moratorium period during which no installment is due."
      },
      {
        schemeId: microFinance.id,
        content:
          "Eligibility for both schemes requires the applicant to belong to a marginalized community " +
          "targeted under Ministry of Social Justice & Empowerment schemes, with family income within the " +
          "prescribed limit. Applications are routed through Channel Partners — State Channelizing " +
          "Agencies (SCAs), Public Sector Banks, Regional Rural Banks, or NBFC-MFIs — and are not accepted " +
          "as direct applications to the funding agency."
      }
    ]
  });

  // ---------------------------------------------------------------------
  // 3. Sample Channel Partners around a representative district (used for
  //    the geo-proximity routing demo and the map view).
  // ---------------------------------------------------------------------
  await prisma.partner.createMany({
    data: [
      {
        name: "Patna District Cooperative Bank",
        type: "SCA",
        village: "Patna Sadar",
        block: "Patna Sadar",
        district: "Patna",
        latitude: 25.5941,
        longitude: 85.1376,
        hasHighNPA: false,
        active: true
      },
      {
        name: "Bihar Gramin Bank — Rampur Branch",
        type: "RRB",
        village: "Rampur",
        block: "Danapur",
        district: "Patna",
        latitude: 25.6335,
        longitude: 85.0453,
        hasHighNPA: false,
        active: true
      },
      {
        name: "National Rural NBFC-MFI Trust",
        type: "NBFC_MFI",
        village: "Phulwari",
        block: "Phulwari Sharif",
        district: "Patna",
        latitude: 25.5808,
        longitude: 85.0393,
        hasHighNPA: true, // deliberately seeded high-NPA so the routing filter is demonstrable
        active: true
      },
      {
        name: "State Bank Rural Branch — Masaurhi",
        type: "PSB",
        village: "Masaurhi",
        block: "Masaurhi",
        district: "Patna",
        latitude: 25.3667,
        longitude: 84.9167,
        hasHighNPA: false,
        active: true
      }
    ],
    skipDuplicates: true
  });

  // ---------------------------------------------------------------------
  // 4. Demo persona — "Sunita", a dairy entrepreneur from village Rampur.
  //    ₹14,000 margin capital -> exactly ₹1,40,000 project cost -> Micro
  //    Finance Scheme boundary. Ships with a statically pre-generated
  //    AIReport row so the one-click demo path never needs a live Gemini
  //    API call. This is the ONLY fallback report content in the system —
  //    there is no general-purpose offline generator.
  // ---------------------------------------------------------------------
  const sunitaPasswordHash = await argon2.hash("Demo@12345");

  const sunita = await prisma.user.upsert({
    where: { phone: "9999900001" },
    update: {},
    create: {
      phone: "9999900001",
      name: "Sunita Devi",
      role: "ENTREPRENEUR",
      village: "Rampur",
      block: "Danapur",
      district: "Patna",
      latitude: 25.6335,
      longitude: 85.0453,
      passwordHash: sunitaPasswordHash
    }
  });

  const sunitaApplication = await prisma.application.upsert({
    where: { id: "seed-sunita-application" },
    update: {},
    create: {
      id: "seed-sunita-application",
      userId: sunita.id,
      marginCapital: 14000,
      projectCost: 140000,
      loanAmount: 126000,
      schemeId: microFinance.id,
      businessCategory: "Dairy",
      status: "ROUTED"
    }
  });

  await prisma.aIReport.upsert({
    where: { applicationId: sunitaApplication.id },
    update: {},
    create: {
      applicationId: sunitaApplication.id,
      isStaticFallback: true,
      rawSources: [],
      marketReach: {
        radiusKm: 7,
        estimatedConsumerBase: 4200,
        primaryDistributionChannels: ["Local haat (weekly market)", "Door-to-door delivery", "Nearby kirana stores"],
        summary:
          "Rampur and its surrounding hamlets support an estimated 4,200-person consumer base within a " +
          "7km radius, with milk and dairy products currently sourced informally from scattered household " +
          "producers rather than a organized dairy."
      },
      opportunityAnalysis: {
        underservedNiches: ["Processed paneer and curd (value-added dairy)", "Doorstep subscription delivery"],
        summary:
          "No organized dairy currently serves Rampur block; most households buy loose milk from individual " +
          "sellers with inconsistent quality and supply. Value-added products (paneer, curd, ghee) are almost " +
          "entirely absent locally and are currently sourced from Patna city, a 45-minute trip."
      },
      swot: {
        strengths: ["Strong local dairy farming tradition", "Low competition for organized/branded supply"],
        weaknesses: ["Limited cold-chain / refrigerated storage access", "Seasonal fodder cost fluctuation"],
        opportunities: ["Government dairy cooperative linkage schemes", "Growing demand from nearby Patna suburbs"],
        threats: ["Monsoon-season transport disruption", "Price undercutting from informal sellers"]
      },
      threats: {
        supplyChainRisks: ["Dependence on a single milk collection route during monsoon"],
        seasonalRisks: ["Reduced milk yield in peak summer months without fodder planning"],
        buyerDependencyRisk:
          "Low — the local haat and door-to-door model spreads sales across many small buyers rather than one large buyer."
      },
      competitorDensity: {
        count: 3,
        interpretation:
          "Only 3 small-scale, informal dairy sellers identified within a 5km radius — low organized competition."
      },
      pricingSuggestion: {
        strategy: "Anchor pricing slightly above informal sellers to signal quality/consistency, bundle with doorstep delivery.",
        suggestedRangeNote:
          "Local informal milk sells around ₹45-50/litre; an organized, consistent-quality offering can typically " +
          "sustain a modest premium once trust is established."
      }
    }
  });

  console.log("Seed complete.");
  console.log("Demo login — phone: 9999900001, password: Demo@12345");
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
