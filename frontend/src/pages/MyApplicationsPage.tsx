import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { listMyApplications } from "@/services/application.service";
import type { Application } from "@/types";

export function MyApplicationsPage() {
  const { t } = useTranslation();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listMyApplications()
      .then(setApplications)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl text-paper-100">{t("nav.myApplications")}</h1>
        <Link to="/apply">
          <Button>{t("landing.ctaStart")}</Button>
        </Link>
      </div>

      {loading && <p className="text-paper-300">Loading...</p>}
      {!loading && applications.length === 0 && (
        <Card>
          <p className="text-paper-300">No applications yet.</p>
        </Card>
      )}

      <div className="space-y-4">
        {applications.map((app) => (
          <Link key={app.id} to={`/report/${app.id}`}>
            <Card className="transition-colors hover:border-turmeric-500/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-display text-lg text-paper-100">{app.businessCategory}</p>
                  <p className="text-sm text-paper-300">
                    ₹{Number(app.projectCost).toLocaleString("en-IN")} project cost · {app.scheme?.name ?? "—"}
                  </p>
                </div>
                <Badge tone={app.status === "ROUTED" ? "positive" : "neutral"}>{app.status}</Badge>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
