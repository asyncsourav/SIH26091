import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  children: ReactNode;
}

const variantClasses: Record<string, string> = {
  primary: "bg-turmeric-500 text-ink-950 hover:bg-turmeric-400 disabled:opacity-50",
  secondary: "bg-ink-700 text-paper-100 hover:bg-ink-600 border border-ink-600",
  ghost: "bg-transparent text-paper-100 hover:bg-ink-800",
  danger: "bg-terracotta-500 text-paper-100 hover:bg-terracotta-400"
};

export function Button({ variant = "primary", className = "", children, ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 font-body font-semibold text-sm transition-colors disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
