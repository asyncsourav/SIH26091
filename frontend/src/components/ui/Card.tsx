import type { HTMLAttributes, ReactNode } from "react";

export function Card({ className = "", children, ...props }: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      className={`rounded-xl border border-ink-700 bg-ink-800/80 p-6 shadow-lg shadow-black/20 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
