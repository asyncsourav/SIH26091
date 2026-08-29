import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  listDuplicateReviews,
  decideDuplicateReview,
  listSchemes,
  updateScheme
} from "@/services/admin.service";

interface DuplicateReviewRow {
  id: string;
  similarityScore: number;
  applicant?: { name: string; village: string; phone: string };
  matched?: { name: string; village: string; phone: string };
}

interface SchemeRow {
  id: string;
  name: string;
  interestRate: string;
  tenureMonths: number;
  moratoriumMonths: number;
  maxProjectCost: string;
}

export function AdminDashboard() {
  const { t } = useTranslation();
  const [reviews, setReviews] = useState<DuplicateReviewRow[]>([]);
  const [schemes, setSchemes] = useState<SchemeRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const [r, s] = await Promise.all([listDuplicateReviews(), listSchemes()]);
    setReviews(r);
    setSchemes(s);
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  async function handleDecision(id: string, status: "APPROVED" | "REJECTED") {
    await decideDuplicateReview(id, status);
    setReviews((prev) => prev.filter((r) => r.id !== id));
  }

  async function handleRateChange(id: string, interestRate: string) {
    const updated = await updateScheme(id, { interestRate: Number(interestRate) });
    setSchemes((prev) => prev.map((s) => (s.id === id ? { ...s, interestRate: updated.interestRate } : s)));
  }

  if (loading) return <p className="p-8 text-paper-300">Loading...</p>;

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="mb-8 font-display text-3xl text-paper-100">{t("admin.title")}</h1>

      <section className="mb-10">
        <h2 className="mb-4 font-display text-xl text-paper-100">{t("admin.duplicateQueue")}</h2>
        {reviews.length === 0 && (
          <Card>
            <p className="text-paper-300">No pending reviews.</p>
          </Card>
        )}
        <div className="space-y-3">
          {reviews.map((review) => (
            <Card key={review.id}>
              <div className="mb-2 flex items-center justify-between">
                <Badge tone="warning">
                  {t("admin.similarity")}: {(review.similarityScore * 100).toFixed(0)}%
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm text-paper-200">
                <div>
                  <p className="text-paper-300">New applicant</p>
                  <p>{review.applicant?.name}</p>
                  <p className="text-xs text-paper-300">{review.applicant?.village} · {review.applicant?.phone}</p>
                </div>
                <div>
                  <p className="text-paper-300">Matched existing user</p>
                  <p>{review.matched?.name}</p>
                  <p className="text-xs text-paper-300">{review.matched?.village} · {review.matched?.phone}</p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button onClick={() => handleDecision(review.id, "APPROVED")}>{t("admin.approve")}</Button>
                <Button variant="danger" onClick={() => handleDecision(review.id, "REJECTED")}>
                  {t("admin.reject")}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-display text-xl text-paper-100">{t("admin.schemes")}</h2>
        <div className="space-y-3">
          {schemes.map((scheme) => (
            <Card key={scheme.id}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-display text-lg text-paper-100">{scheme.name}</p>
                  <p className="text-xs text-paper-300">
                    Up to ₹{Number(scheme.maxProjectCost).toLocaleString("en-IN")} · {scheme.tenureMonths / 12} yrs
                    tenure · {scheme.moratoriumMonths}mo moratorium
                  </p>
                </div>
                <label className="flex items-center gap-2 text-sm text-paper-200">
                  Interest %
                  <input
                    type="number"
                    step="0.1"
                    defaultValue={scheme.interestRate}
                    onBlur={(e) => handleRateChange(scheme.id, e.target.value)}
                    className="w-20 rounded-md border border-ink-600 bg-ink-900 px-2 py-1 text-paper-100"
                  />
                </label>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
