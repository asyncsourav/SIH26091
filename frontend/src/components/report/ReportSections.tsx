import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { FeasibilityReport } from "@/types";

// Staggered reveal: the full report JSON arrives in a single response (see
// build spec — no live token streaming, for demo reliability over venue
// wifi), but each section fades in ~0.35s apart on the frontend so it still
// *feels* like it's being generated live.
const sectionVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.35, duration: 0.5, ease: "easeOut" }
  })
};

function Section({ index, title, children }: { index: number; title: string; children: React.ReactNode }) {
  return (
    <motion.div custom={index} initial="hidden" animate="visible" variants={sectionVariants}>
      <Card className="mb-5">
        <h3 className="mb-3 font-display text-lg text-paper-100">{title}</h3>
        {children}
      </Card>
    </motion.div>
  );
}

export function ReportSections({ report }: { report: FeasibilityReport }) {
  const { t } = useTranslation();

  return (
    <div>
      {report.isStaticFallback && (
        <Badge tone="warning">{t("report.demoNotice")}</Badge>
      )}

      <div className="mt-4">
        <Section index={0} title={t("report.marketReach")}>
          <p className="mb-3 text-sm text-paper-200">{report.marketReach.summary}</p>
          <div className="flex flex-wrap gap-2 text-xs text-paper-300">
            <Badge tone="neutral">{report.marketReach.estimatedConsumerBase.toLocaleString("en-IN")} people within {report.marketReach.radiusKm}km</Badge>
            {report.marketReach.primaryDistributionChannels.map((c) => (
              <Badge key={c} tone="neutral">{c}</Badge>
            ))}
          </div>
        </Section>

        <Section index={1} title={t("report.opportunity")}>
          <p className="mb-3 text-sm text-paper-200">{report.opportunityAnalysis.summary}</p>
          <ul className="list-inside list-disc space-y-1 text-sm text-paper-200">
            {report.opportunityAnalysis.underservedNiches.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </Section>

        <Section index={2} title={t("report.swot")}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SwotList label={t("report.strengths")} items={report.swot.strengths} tone="positive" />
            <SwotList label={t("report.weaknesses")} items={report.swot.weaknesses} tone="danger" />
            <SwotList label={t("report.opportunities")} items={report.swot.opportunities} tone="warning" />
            <SwotList label={t("report.threats")} items={report.swot.threats} tone="danger" />
          </div>
        </Section>

        <Section index={3} title={t("report.competitorDensity")}>
          <p className="text-sm text-paper-200">
            <span className="mr-2 font-display text-2xl text-turmeric-400">{report.competitorDensity.count}</span>
            {report.competitorDensity.interpretation}
          </p>
        </Section>

        <Section index={4} title={t("report.pricing")}>
          <p className="mb-2 text-sm text-paper-200">{report.pricingSuggestion.strategy}</p>
          <p className="text-xs text-paper-300">{report.pricingSuggestion.suggestedRangeNote}</p>
        </Section>
      </div>
    </div>
  );
}

function SwotList({ label, items, tone }: { label: string; items: string[]; tone: "positive" | "danger" | "warning" }) {
  return (
    <div>
      <Badge tone={tone}>{label}</Badge>
      <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-paper-200">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
