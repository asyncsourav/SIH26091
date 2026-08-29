import type { ReactNode } from "react";

const toneClasses: Record<string, string> = {
  neutral: "bg-ink-700 text-paper-200",
  positive: "bg-paddy-500/20 text-paddy-400 border border-paddy-500/40",
  warning: "bg-turmeric-500/20 text-turmeric-400 border border-turmeric-500/40",
  danger: "bg-terracotta-500/20 text-terracotta-400 border border-terracotta-500/40"
};

export function Badge({ tone = "neutral", children }: { tone?: keyof typeof toneClasses; children: ReactNode }) {
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${toneClasses[tone]}`}>
      {children}
    </span>
  );
}
