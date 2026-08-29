import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { ArrowRight, Sparkles } from "lucide-react";

export function LandingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-4xl px-6 py-20 text-center">
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-4 inline-flex items-center gap-2 rounded-full border border-turmeric-500/40 bg-turmeric-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-turmeric-400"
      >
        <Sparkles className="h-3.5 w-3.5" />
        {t("landing.eyebrow")}
      </motion.p>

      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="font-display text-4xl font-semibold leading-tight text-paper-100 sm:text-5xl"
      >
        {t("landing.title")}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mx-auto mt-5 max-w-2xl text-paper-300"
      >
        {t("landing.subtitle")}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-8 flex flex-wrap items-center justify-center gap-4"
      >
        <Button onClick={() => navigate("/apply")}>
          {t("landing.ctaStart")}
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Button variant="secondary" onClick={() => navigate("/demo/sunita")}>
          {t("landing.ctaDemo")}
        </Button>
      </motion.div>

      <div className="stitch-divider mx-auto mt-20 max-w-xs" />
    </div>
  );
}
