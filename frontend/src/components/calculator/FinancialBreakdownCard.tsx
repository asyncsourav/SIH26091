import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { FinancialBreakdown } from "@/types";

function formatINR(value: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(
    value
  );
}

export function FinancialBreakdownCard({ breakdown }: { breakdown: FinancialBreakdown }) {
  const { t } = useTranslation();

  if (breakdown.scheme.slab === "OUT_OF_RANGE") {
    return (
      <Card className="border-terracotta-500/50">
        <Badge tone="danger">{t("calculator.outOfRange")}</Badge>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="mb-4 font-display text-xl text-paper-100">{t("calculator.title")}</h3>
      <dl className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
        <div>
          <dt className="text-paper-300">{t("calculator.yourContribution")}</dt>
          <dd className="mt-0.5 font-display text-lg text-paper-100">{formatINR(breakdown.marginCapital)}</dd>
        </div>
        <div>
          <dt className="text-paper-300">{t("calculator.projectCost")}</dt>
          <dd className="mt-0.5 font-display text-lg text-paper-100">{formatINR(breakdown.projectCost)}</dd>
        </div>
        <div>
          <dt className="text-paper-300">{t("calculator.loanAmount")}</dt>
          <dd className="mt-0.5 font-display text-lg text-turmeric-400">{formatINR(breakdown.loanAmount)}</dd>
        </div>
        <div>
          <dt className="text-paper-300">{t("calculator.scheme")}</dt>
          <dd className="mt-0.5">
            <Badge tone="positive">{breakdown.scheme.name}</Badge>
          </dd>
        </div>
        <div>
          <dt className="text-paper-300">{t("calculator.interestRate")}</dt>
          <dd className="mt-0.5 text-paper-100">{breakdown.scheme.interestRatePct}% p.a.</dd>
        </div>
        <div>
          <dt className="text-paper-300">{t("calculator.tenure")}</dt>
          <dd className="mt-0.5 text-paper-100">{breakdown.scheme.tenureMonths / 12} years</dd>
        </div>
        <div>
          <dt className="text-paper-300">{t("calculator.moratorium")}</dt>
          <dd className="mt-0.5 text-paper-100">{breakdown.scheme.moratoriumMonths} months</dd>
        </div>
      </dl>
    </Card>
  );
}
