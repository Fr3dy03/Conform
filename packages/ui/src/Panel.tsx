import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

export function Panel({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border border-line bg-panel/90 shadow-[0_1px_0_rgba(255,255,255,0.025)_inset]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function PanelHeader({
  title,
  description,
  actions,
  eyebrow,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  eyebrow?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-b border-line px-5 py-4 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow ? (
          <div className="mb-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted">
            {eyebrow}
          </div>
        ) : null}
        <h2 className="text-[15px] font-semibold tracking-[-0.015em] text-paper">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 max-w-2xl text-[12.5px] leading-5 text-muted">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}

export function Callout({
  tone = "neutral",
  title,
  children,
  icon,
  className,
}: {
  tone?: "neutral" | "lime" | "amber" | "coral";
  title?: ReactNode;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  const tones = {
    neutral: "border-line-strong bg-white/[0.02]",
    lime: "border-lime/20 bg-lime/[0.045]",
    amber: "border-amber/25 bg-amber/[0.045]",
    coral: "border-coral/25 bg-coral/[0.045]",
  };
  const textTones = {
    neutral: "text-muted",
    lime: "text-lime",
    amber: "text-amber",
    coral: "text-coral",
  };
  return (
    <div className={cn("rounded-lg border p-4", tones[tone], className)}>
      <div className="flex gap-3">
        {icon ? (
          <div className={cn("mt-0.5 shrink-0", textTones[tone])}>{icon}</div>
        ) : null}
        <div className="min-w-0">
          {title ? (
            <div
              className={cn(
                "text-[12.5px] font-semibold tracking-[-0.01em]",
                textTones[tone],
              )}
            >
              {title}
            </div>
          ) : null}
          <div className={cn("text-[12.5px] leading-5", title ? "mt-1" : "", "text-muted")}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: {
  title: ReactNode;
  description: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-line-strong bg-black/10 px-6 py-12 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="mb-4 flex size-10 items-center justify-center rounded-lg border border-line bg-elevated text-muted">
          {icon}
        </div>
      ) : null}
      <h3 className="text-sm font-semibold text-paper">{title}</h3>
      <p className="mt-1.5 max-w-sm text-[12.5px] leading-5 text-muted">
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function DataRow({
  label,
  children,
  mono = false,
  className,
}: {
  label: ReactNode;
  children: ReactNode;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 border-b border-line/70 py-2.5 last:border-b-0",
        className,
      )}
    >
      <span className="shrink-0 text-[11.5px] text-muted">{label}</span>
      <span
        className={cn(
          "min-w-0 break-all text-right text-[11.5px] text-paper/90",
          mono && "font-mono text-[10.5px]",
        )}
      >
        {children}
      </span>
    </div>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
      {children}
    </div>
  );
}
