import type { ReactNode } from "react";
import { cn } from "./cn";

export type BadgeTone =
  | "neutral"
  | "lime"
  | "amber"
  | "coral"
  | "outline"
  | "violet";

const toneClasses: Record<BadgeTone, string> = {
  neutral: "bg-white/[0.055] text-muted border-white/[0.08]",
  lime: "bg-lime/[0.09] text-lime border-lime/20",
  amber: "bg-amber/[0.08] text-amber border-amber/25",
  coral: "bg-coral/[0.08] text-coral border-coral/25",
  outline: "bg-transparent text-muted border-line-strong",
  violet: "bg-[#b69cff]/[0.08] text-[#c7b4ff] border-[#b69cff]/25",
};

export function Badge({
  children,
  tone = "neutral",
  dot = false,
  className,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center gap-1.5 rounded-full border px-2 text-[10px] font-semibold uppercase tracking-[0.08em]",
        toneClasses[tone],
        className,
      )}
    >
      {dot ? (
        <span
          className={cn(
            "size-1.5 rounded-full",
            tone === "lime" && "bg-lime",
            tone === "amber" && "bg-amber",
            tone === "coral" && "bg-coral",
            tone === "violet" && "bg-[#c7b4ff]",
            tone === "neutral" && "bg-muted",
            tone === "outline" && "bg-muted",
          )}
        />
      ) : null}
      {children}
    </span>
  );
}

export type StatusValue =
  | "pass"
  | "warn"
  | "fail"
  | "skip"
  | "unknown"
  | "running"
  | "pending";

const statusMap: Record<
  StatusValue,
  { label: string; tone: BadgeTone }
> = {
  pass: { label: "Pass", tone: "lime" },
  warn: { label: "Warn", tone: "amber" },
  fail: { label: "Fail", tone: "coral" },
  skip: { label: "Skipped", tone: "neutral" },
  unknown: { label: "Unknown", tone: "amber" },
  running: { label: "Running", tone: "neutral" },
  pending: { label: "Pending", tone: "amber" },
};

export function StatusBadge({
  status,
  className,
  label,
}: {
  status: StatusValue;
  className?: string;
  label?: string;
}) {
  const config = statusMap[status];
  return (
    <Badge tone={config.tone} dot className={className}>
      {label ?? config.label}
    </Badge>
  );
}

export function StatusDot({
  status,
  className,
}: {
  status: StatusValue;
  className?: string;
}) {
  const color =
    status === "pass"
      ? "bg-lime"
      : status === "warn" || status === "unknown" || status === "pending"
        ? "bg-amber"
        : status === "fail"
          ? "bg-coral"
          : status === "running"
            ? "bg-paper animate-pulse"
            : "bg-muted/60";
  return (
    <span
      className={cn("inline-block size-1.5 rounded-full", color, className)}
      aria-hidden="true"
    />
  );
}
