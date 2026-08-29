import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, className = "", ...props }, ref) => {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-medium text-paper-200">{label}</span>}
      <input
        ref={ref}
        className={`w-full rounded-lg border border-ink-600 bg-ink-900 px-4 py-2.5 text-paper-100 placeholder:text-ink-600 focus:border-turmeric-500 focus:outline-none ${className}`}
        {...props}
      />
      {error && <span className="mt-1 block text-xs text-terracotta-400">{error}</span>}
    </label>
  );
});
Input.displayName = "Input";
