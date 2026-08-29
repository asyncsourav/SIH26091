import { useTranslation } from "react-i18next";
import { FileText } from "lucide-react";
import { Card } from "@/components/ui/Card";

export function SourcesDrawer({ sourceCount }: { sourceCount: number }) {
  const { t } = useTranslation();

  return (
    <Card className="border-ink-600 bg-ink-900/60">
      <div className="flex items-center gap-2 text-sm text-paper-300">
        <FileText className="h-4 w-4 text-turmeric-400" />
        <span className="font-semibold text-paper-200">{t("report.sources")}</span>
      </div>
      <p className="mt-2 text-xs text-paper-300">
        {sourceCount > 0
          ? `${sourceCount} official scheme document excerpt${sourceCount > 1 ? "s" : ""} were retrieved and used to ground this report.`
          : t("report.sourcesEmpty")}
      </p>
    </Card>
  );
}
