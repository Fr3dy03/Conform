import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";
import { Spinner } from "./Spinner";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-lime text-ink border border-lime hover:bg-[#d7ff86] active:bg-[#b7ea4f]",
  secondary:
    "bg-elevated text-paper border border-line-strong hover:border-line-bright hover:bg-[#1b211c]",
  outline:
    "bg-transparent text-paper border border-line-strong hover:border-lime/50 hover:text-lime",
  ghost:
    "bg-transparent text-muted border border-transparent hover:bg-white/[0.04] hover:text-paper",
  danger:
    "bg-transparent text-coral border border-coral/35 hover:bg-coral/[0.07] hover:border-coral/60",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[12px] rounded-md gap-1.5",
  md: "h-10 px-4 text-[13px] rounded-md gap-2",
  lg: "h-12 px-5 text-sm rounded-lg gap-2.5",
};

export function buttonClasses({
  variant = "secondary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}): string {
  return cn(
    "inline-flex items-center justify-center whitespace-nowrap font-medium tracking-[-0.01em] transition-[background-color,border-color,color,opacity] duration-150",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime/80 focus-visible:ring-offset-2 focus-visible:ring-offset-ink",
    "disabled:cursor-not-allowed disabled:opacity-40",
    variantClasses[variant],
    sizeClasses[size],
    className,
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
}

export function Button({
  variant = "secondary",
  size = "md",
  loading = false,
  icon,
  className,
  children,
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Spinner className="size-3" /> : icon}
      {children}
    </button>
  );
}
