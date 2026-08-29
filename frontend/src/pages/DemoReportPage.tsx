import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { FinancialBreakdownCard } from "@/components/calculator/FinancialBreakdownCard";
import { ReportSections } from "@/components/report/ReportSections";
import { SourcesDrawer } from "@/components/report/SourcesDrawer";
import { DownloadBusinessPlanButton } from "@/components/pdf/BusinessPlanPdf";
import { getSunitaDemo } from "@/services/demo.service";
import type { Application, FeasibilityReport, FinancialBreakdown } from "@/types";

/**
 * Public demo route (no auth) — shows the seeded "Sunita" persona's
 * pre-generated report via the /api/demo/sunita endpoint, so a judge or
 * first-time visitor can see the full experience with zero setup and zero
 * live API dependency.
 */
export function DemoReportPage() {
  const { t } = useTranslation();
  const [application, setApplication] = useState<Application | null>(null);
  const [report, setReport] = useState<FeasibilityReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSunitaDemo()
      .then((res) => {
        setApplication(res.application);
        setReport(res.report);
      })
      .catch(() => setError("Could not load the demo report. Has the seed script been run?"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-paper-300">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading demo report...
      </div>
    );
  }

  if (error || !application || !report) {
    return <div className="mx-auto max-w-lg px-6 py-16 text-center text-terracotta-400">{error}</div>;
  }

  const breakdown: FinancialBreakdown = {
    marginCapital: Number(application.marginCapital),
    projectCost: Number(application.projectCost),
    loanAmount: Number(application.loanAmount),
    scheme: {
      slab: "MICRO_FINANCE",
      name: application.scheme?.name ?? "Micro Finance Scheme",
      interestRatePct: Number(application.scheme?.interestRate ?? 6.5),
      tenureMonths: application.scheme?.tenureMonths ?? 36,
      moratoriumMonths: application.scheme?.moratoriumMonths ?? 3
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="mb-2 font-display text-3xl text-paper-100">
        Meet Sunita — {application.businessCategory} entrepreneur
      </h1>
      <p className="mb-8 text-paper-300">
        {application.user?.village}, {application.user?.block} block — a sample, pre-generated report.
      </p>

      <div className="mb-6">
        <FinancialBreakdownCard breakdown={breakdown} />
      </div>

      <ReportSections report={report} />
      <div className="mb-6">
        <SourcesDrawer sourceCount={report.rawSources?.length ?? 0} />
      </div>

      <DownloadBusinessPlanButton application={application} breakdown={breakdown} report={report} />
    </div>
  );
}
