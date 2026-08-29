import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { listIncomingApplications, decideRouting } from "@/services/partner.service";

interface RoutingRow {
  id: string;
  distanceKm: number;
  application: {
    businessCategory: string;
    projectCost: string;
    loanAmount: string;
    user: { name: string; village: string };
  };
  partner: { name: string; hasHighNPA: boolean };
}

export function PartnerDashboard() {
  const { t } = useTranslation();
  const [routings, setRoutings] = useState<RoutingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listIncomingApplications()
      .then(setRoutings)
      .finally(() => setLoading(false));
  }, []);

  async function handleDecision(id: string, decision: "ACCEPTED" | "REJECTED") {
    await decideRouting(id, decision);
    setRoutings((prev) => prev.filter((r) => r.id !== id));
  }

  if (loading) return <p className="p-8 text-paper-300">Loading...</p>;

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="mb-8 font-display text-3xl text-paper-100">{t("partner.title")}</h1>

      {routings.length === 0 && (
        <Card>
          <p className="text-paper-300">No incoming applications right now.</p>
        </Card>
      )}

      <div className="space-y-4">
        {routings.map((routing) => (
          <Card key={routing.id}>
            <div className="mb-2 flex items-center justify-between">
              <p className="font-display text-lg text-paper-100">{routing.application.businessCategory}</p>
              <Badge tone="neutral">
                {t("partner.distance")}: {routing.distanceKm.toFixed(1)} km
              </Badge>
            </div>
            <p className="text-sm text-paper-200">
              {routing.application.user.name} · {routing.application.user.village}
            </p>
            <p className="mt-1 text-sm text-paper-300">
              Loan requested: ₹{Number(routing.application.loanAmount).toLocaleString("en-IN")}
            </p>
            <div className="mt-4 flex gap-2">
              <Button onClick={() => handleDecision(routing.id, "ACCEPTED")}>{t("partner.accept")}</Button>
              <Button variant="danger" onClick={() => handleDecision(routing.id, "REJECTED")}>
                {t("partner.reject")}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
