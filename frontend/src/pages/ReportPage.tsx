import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { FinancialBreakdownCard } from "@/components/calculator/FinancialBreakdownCard";
import { EmiScheduleChart } from "@/components/calculator/EmiScheduleChart";
import { ReportSections } from "@/components/report/ReportSections";
import { SourcesDrawer } from "@/components/report/SourcesDrawer";
import { CompetitorMap } from "@/components/map/CompetitorMap";
import { DownloadBusinessPlanButton } from "@/components/pdf/BusinessPlanPdf";
import { getApplication, generateReport, getReport } from "@/services/application.service";
import { computePreview } from "@/services/application.service";
import type { Application, FeasibilityReport, FinancialBreakdown, EmiScheduleRow, CompetitorPin } from "@/types";

export function ReportPage() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const { t } = useTranslation();

  const [application, setApplication] = useState<Application | null>(null);
  const [breakdown, setBreakdown] = useState<FinancialBreakdown | null>(null);
  const [emiSchedule, setEmiSchedule] = useState<EmiScheduleRow[]>([]);
  const [report, setReport] = useState<FeasibilityReport | null>(null);
  const [pins, setPins] = useState<CompetitorPin[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!applicationId) return;
    (async () => {
      try {
        const app: Application = await getApplication(applicationId);
        setApplication(app);

        // Recompute the breakdown display from the persisted application
        // figures via the same pure calculator endpoint, so the report page
        // never needs to re-derive scheme selection logic itself.
        const preview = await computePreview(Number(app.marginCapital));
        setBreakdown(preview.breakdown);
        setEmiSchedule(preview.emiSchedule);

        try {
          const existing = await getReport(applicationId);
          setReport(existing);
        } catch {
          // No report yet — generate one.
          setReportLoading(true);
          const res = await generateReport(applicationId);
          setReport(res.report);
          if (res.competitorPins) setPins(res.competitorPins as CompetitorPin[]);
          setReportLoading(false);
        }
      } catch (err: any) {
        setError(err?.response?.data?.error?.message ?? "Could not load this application.");
      } finally {
        setLoading(false);
      }
    })();
  }, [applicationId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-paper-300">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading...
      </div>
    );
  }

  if (error) {
    return <div className="mx-auto max-w-lg px-6 py-16 text-center text-terracotta-400">{error}</div>;
  }

  if (!application || !breakdown) return null;

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="mb-8 font-display text-3xl text-paper-100">
        {application.businessCategory} — {t("calculator.title")}
      </h1>

      <div className="mb-6 grid gap-6 sm:grid-cols-2">
        <FinancialBreakdownCard breakdown={breakdown} />
        <EmiScheduleChart schedule={emiSchedule} />
      </div>

      {reportLoading && !report && (
        <Card className="mb-6 flex items-center gap-3 text-paper-300">
          <Loader2 className="h-5 w-5 animate-spin text-turmeric-400" />
          {t("report.generating")}
        </Card>
      )}

      {report && (
        <>
          <ReportSections report={report} />
          <div className="mb-6">
            <SourcesDrawer sourceCount={report.rawSources?.length ?? 0} />
          </div>

          {pins.length > 0 && (
            <div className="mb-6">
              <CompetitorMap
                centerLat={application.user?.latitude ?? 25.6335}
                centerLon={application.user?.longitude ?? 85.0453}
                pins={pins}
              />
            </div>
          )}

          <DownloadBusinessPlanButton application={application} breakdown={breakdown} report={report} />
        </>
      )}
    </div>
  );
}
