import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary: "bg-accent-strong text-white hover:brightness-95 border border-transparent",
  secondary: "bg-card text-ink border border-line hover:bg-surface",
  ghost: "bg-transparent text-muted hover:bg-surface hover:text-ink border border-transparent",
  danger: "bg-danger text-white hover:brightness-95 border border-transparent",
};

export function Button({
  variant = "secondary",
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}

export function IconButton({
  label,
  className = "",
  type = "button",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={`inline-flex size-10 shrink-0 items-center justify-center rounded-xl text-muted transition-colors duration-150 hover:bg-surface hover:text-ink disabled:opacity-60 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
