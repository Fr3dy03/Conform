import type { ReactNode } from "react";
import { cn } from "@conform/ui";

export function ConsoleSection({
  id,
  eyebrow,
  title,
  description,
  actions,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const titleId = `${id}-title`;
  return (
    <section id={id} aria-labelledby={titleId} className="scroll-mt-24">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="mono-label">{eyebrow}</div>
          <h2
            id={titleId}
            className="mt-1.5 text-[21px] font-semibold tracking-[-0.03em] text-paper"
          >
            {title}
          </h2>
          {description ? (
            <p className="mt-1 max-w-2xl text-[12px] leading-5 text-muted">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        ) : null}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export function Metric({
  label,
  value,
  hint,
  mono = false,
  tone = "default",
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  mono?: boolean;
  tone?: "default" | "positive" | "warning" | "negative";
  className?: string;
}) {
  return (
    <div className={cn("min-w-0 px-4 py-3.5", className)}>
      <div className="font-mono text-[8.5px] uppercase tracking-[0.12em] text-muted/70">
        {label}
      </div>
      <div
        className={cn(
          "mt-1 truncate text-[14px] font-medium tracking-[-0.01em] text-paper",
          mono && "font-mono text-[11.5px]",
          tone === "positive" && "text-lime",
          tone === "warning" && "text-amber",
          tone === "negative" && "text-coral",
        )}
        title={typeof value === "string" ? value : undefined}
      >
        {value}
      </div>
      {hint ? (
        <div className="mt-0.5 truncate text-[10px] text-muted/65">{hint}</div>
      ) : null}
    </div>
  );
}

export function MetricGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid divide-y divide-line border-b border-line sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4 lg:[&>*:nth-child(-n+2)]:border-b lg:[&>*:nth-child(-n+2)]:border-line">
      {children}
    </div>
  );
}
