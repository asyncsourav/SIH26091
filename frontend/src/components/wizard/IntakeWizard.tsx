import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { FinancialBreakdownCard } from "@/components/calculator/FinancialBreakdownCard";
import { computePreview, createApplication } from "@/services/application.service";
import type { FinancialBreakdown } from "@/types";

interface WizardForm {
  village: string;
  block: string;
  district: string;
  marginCapital: number;
  businessCategory: string;
}

const CATEGORY_KEYS = ["dairy", "retail", "textiles", "poultry", "agribusiness", "handicrafts"] as const;

const STEP_LABELS = ["step1Title", "step2Title", "step3Title"] as const;

export function IntakeWizard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [preview, setPreview] = useState<FinancialBreakdown | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    formState: { errors }
  } = useForm<WizardForm>({ defaultValues: { businessCategory: "dairy" } });

  const marginCapital = watch("marginCapital");

  async function handlePreview() {
    if (!marginCapital || marginCapital <= 0) {
      setPreview(null);
      return;
    }
    setPreviewLoading(true);
    try {
      const res = await computePreview(Number(marginCapital));
      setPreview(res.breakdown);
    } catch {
      setPreview(null);
    } finally {
      setPreviewLoading(false);
    }
  }

  async function goNext() {
    const fieldsByStep: (keyof WizardForm)[][] = [
      ["village", "block", "district"],
      ["marginCapital"],
      ["businessCategory"]
    ];
    const valid = await trigger(fieldsByStep[step]);
    if (!valid) return;
    if (step === 1) await handlePreview();
    setStep((s) => Math.min(s + 1, 2));
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 0));
  }

  async function onSubmit(data: WizardForm) {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await createApplication({
        marginCapital: Number(data.marginCapital),
        businessCategory: t(`categories.${data.businessCategory}`)
      });
      navigate(`/report/${res.application.id}`);
    } catch (err: any) {
      setSubmitError(err?.response?.data?.error?.message ?? "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Signature step tracker — a stitched thread connecting steps, echoing
          the handloom motif rather than generic numbered dots. */}
      <div className="mb-8 flex items-center gap-2">
        {STEP_LABELS.map((_, i) => (
          <div key={i} className="flex flex-1 items-center gap-2">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 font-display text-sm ${
                i <= step ? "border-turmeric-400 bg-turmeric-400 text-ink-950" : "border-ink-600 text-paper-300"
              }`}
            >
              {i + 1}
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div className={`h-0.5 flex-1 ${i < step ? "bg-turmeric-400" : "bg-ink-600"}`} />
            )}
          </div>
        ))}
      </div>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)}>
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="step0" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
                <h2 className="mb-4 font-display text-2xl text-paper-100">{t("wizard.step1Title")}</h2>
                <div className="space-y-4">
                  <Input label={t("wizard.village")} {...register("village", { required: true })} error={errors.village && "Required"} />
                  <Input label={t("wizard.block")} {...register("block", { required: true })} error={errors.block && "Required"} />
                  <Input label={t("wizard.district")} {...register("district", { required: true })} error={errors.district && "Required"} />
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
                <h2 className="mb-4 font-display text-2xl text-paper-100">{t("wizard.step2Title")}</h2>
                <Input
                  type="number"
                  min={1}
                  label={t("wizard.marginCapitalLabel")}
                  {...register("marginCapital", { required: true, min: 1, valueAsNumber: true, onChange: handlePreview })}
                  error={errors.marginCapital && "Enter a valid amount"}
                />
                <div className="mt-4">
                  {previewLoading && <p className="text-sm text-paper-300">{t("wizard.livePreview")}...</p>}
                  {preview && !previewLoading && <FinancialBreakdownCard breakdown={preview} />}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
                <h2 className="mb-4 font-display text-2xl text-paper-100">{t("wizard.step3Title")}</h2>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-paper-200">{t("wizard.category")}</span>
                  <select
                    {...register("businessCategory", { required: true })}
                    className="w-full rounded-lg border border-ink-600 bg-ink-900 px-4 py-2.5 text-paper-100 focus:border-turmeric-500 focus:outline-none"
                  >
                    {CATEGORY_KEYS.map((key) => (
                      <option key={key} value={key}>
                        {t(`categories.${key}`)}
                      </option>
                    ))}
                  </select>
                </label>
                {submitError && <p className="mt-3 text-sm text-terracotta-400">{submitError}</p>}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-8 flex justify-between">
            <Button type="button" variant="secondary" onClick={goBack} disabled={step === 0}>
              {t("wizard.back")}
            </Button>
            {step < 2 ? (
              <Button type="button" onClick={goNext}>
                {t("wizard.next")}
              </Button>
            ) : (
              <Button type="submit" disabled={submitting}>
                {submitting ? "..." : t("wizard.submit")}
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}
